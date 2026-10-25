import ast
import subprocess
import tempfile
import os
from fastapi.testclient import TestClient


def test_mock_translation_python_to_javascript(client: TestClient, mock_service):
    payload = {
        "source_lang": "python",
        "target_lang": "javascript",
        "code": "def greet(name):\n    print('Hello ' + name)\n    return True",
        "instructions": "use modern ES6 style"
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["source_lang"] == "python"
    assert data["target_lang"] == "javascript"
    assert "console.log" in data["translated_code"]
    assert "true" in data["translated_code"]
    assert "explanation" in data
    assert len(data["explanation"]) > 0
    assert len(data["warnings"]) > 0

    # Ensure provider_info never claims code is formally verified
    assert "provider_info" in data
    assert data["provider_info"]["verified"] is False
    assert data["provider_info"]["provider"] == "mock"


def test_mock_translation_javascript_to_python(client: TestClient, mock_service):
    payload = {
        "source_lang": "javascript",
        "target_lang": "python",
        "code": "function isReady() {\n    console.log('ready');\n    return true;\n}",
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["source_lang"] == "javascript"
    assert data["target_lang"] == "python"
    assert "print" in data["translated_code"]
    assert "True" in data["translated_code"]
    assert data["provider_info"]["verified"] is False


def test_faithful_preservation_comments_strings_typos(client: TestClient, mock_service):
    """
    Regression test ensuring comments, string typos, and identifiers
    are preserved without automated correction or 'helpful' refactoring.
    """
    py_code = (
        "# WARNINGG: do NOT fix this speling typo! ?? ::\n"
        "def calculat_sm(a, b):\n"
        '    msg = "Errror: unexpexted FoObAr condition!"\n'
        "    # retun value beloww... !!\n"
        "    return a + b\n"
    )
    payload = {
        "source_lang": "python",
        "target_lang": "javascript",
        "code": py_code,
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    translated = data["translated_code"]

    # Verify exact comment text preserved
    assert "// WARNINGG: do NOT fix this speling typo! ?? ::" in translated
    assert "// retun value beloww... !!" in translated
    # Verify string literal preserved with exact casing and typo
    assert '"Errror: unexpexted FoObAr condition!"' in translated
    # Verify identifier preserved
    assert "calculat_sm" in translated


def test_faithful_preservation_bugs_and_duplicates(client: TestClient, mock_service):
    """
    Regression test ensuring bugs, flawed conditions, and duplicated values
    are preserved exactly without being 'fixed' or deduplicated.
    """
    py_code = (
        "def check_limit(count):\n"
        "    # Bug: user wrote < 10 but meant <= 10\n"
        "    if count < 10:\n"
        "        return [42, 42, 99, 99]\n"
        "    return []\n"
    )
    payload = {
        "source_lang": "python",
        "target_lang": "javascript",
        "code": py_code,
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    translated = data["translated_code"]

    # Bug must be preserved
    assert "count < 10" in translated
    assert "count <= 10" not in translated
    # Duplicates must be preserved
    assert "42, 42, 99, 99" in translated


def test_faithful_translation_javascript_to_python_syntax(client: TestClient, mock_service):
    """
    Regression test verifying JS -> Python produces syntactically valid Python (via ast.parse)
    while preserving comments and flawed conditions.
    """
    js_code = (
        "// ATTENSHUN: check index\n"
        "function get_item(idx) {\n"
        "    // Intentional bug: idx > 0 excludes 0\n"
        "    if (idx > 0) {\n"
        "        return true;\n"
        "    }\n"
        "    return false;\n"
        "}\n"
    )
    payload = {
        "source_lang": "javascript",
        "target_lang": "python",
        "code": js_code,
    }
    response = client.post("/api/translate", json=payload)
    assert response.status_code == 200
    data = response.json()
    py_translated = data["translated_code"]

    # Comment preserved
    assert "# ATTENSHUN: check index" in py_translated
    # Bug preserved
    assert "idx > 0" in py_translated
    assert "idx >= 0" not in py_translated
    # Must be valid Python syntax
    ast.parse(py_translated)
