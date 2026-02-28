from modules.admin.admin_service import *

print("TEST STARTED")

try:
    add_legal_term(
         "Subpoena",
    "A writ ordering a person to attend court.",
    "A legal notice ordering someone to appear in court."
    )
except Exception as e:
    print("ERROR in add_legal_term:", repr(e))

try:
    terms = get_all_terms()
    print("ALL TERMS:", getattr(terms, 'data', terms))
except Exception as e:
    print("ERROR in get_all_terms:", repr(e))

try:
    update_simplified_definition(
        "Bail",
        "Permission given by court to stay outside jail"
    )
except Exception as e:
    print("ERROR in update_simplified_definition:", repr(e))

print("TEST FINISHED")