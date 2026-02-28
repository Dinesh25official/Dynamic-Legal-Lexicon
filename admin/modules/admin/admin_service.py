from config.database import supabase

# ==============================
# TABLE NAMES
# ==============================

LEGAL_TABLE = "legal_terms"
STATUTORY_TABLE = "statutory_table"
DAILY_TABLE = "daily_term"


# ==========================================================
# 1️⃣ LEGAL_TERMS (MASTER GLOSSARY)
# ==========================================================

def add_legal_term(legal_term, oxford_definition, simplified_definition):
    data = {
        "Legal Term": legal_term,
        "Fixed (Oxford) Definition": oxford_definition,
        "Simplified Definition": simplified_definition
    }

    response = supabase.table(LEGAL_TABLE).insert(data).execute()
    return response.data


def get_all_legal_terms():
    response = supabase.table(LEGAL_TABLE).select("*").execute()
    return response.data


def get_legal_term_by_name(legal_term):
    response = supabase.table(LEGAL_TABLE)\
        .select("*")\
        .eq("Legal Term", legal_term)\
        .execute()
    return response.data


def update_legal_term(legal_term, oxford_definition=None, simplified_definition=None):
    update_data = {}

    if oxford_definition:
        update_data["Fixed (Oxford) Definition"] = oxford_definition

    if simplified_definition:
        update_data["Simplified Definition"] = simplified_definition

    response = supabase.table(LEGAL_TABLE)\
        .update(update_data)\
        .eq("Legal Term", legal_term)\
        .execute()

    return response.data


def delete_legal_term(legal_term):
    response = supabase.table(LEGAL_TABLE)\
        .delete()\
        .eq("Legal Term", legal_term)\
        .execute()

    return response.data


# ==========================================================
# 2️⃣ STATUTORY_TABLE (LINKS TO LEGAL_TERMS)
# ==========================================================

def add_statute(legal_term, statute_name, section, description, url):
    data = {
        "legal_term": legal_term,
        "statute_name": statute_name,
        "section": section,
        "description": description,
        "url": url
    }

    response = supabase.table(STATUTORY_TABLE).insert(data).execute()
    return response.data


def get_statutes_by_term(legal_term):
    response = supabase.table(STATUTORY_TABLE)\
        .select("*")\
        .eq("legal_term", legal_term)\
        .execute()

    return response.data


def update_statute(statute_id, statute_name=None, section=None, description=None, url=None):
    update_data = {}

    if statute_name:
        update_data["statute_name"] = statute_name

    if section:
        update_data["section"] = section

    if description:
        update_data["description"] = description

    if url:
        update_data["url"] = url

    response = supabase.table(STATUTORY_TABLE)\
        .update(update_data)\
        .eq("id", statute_id)\
        .execute()

    return response.data


def delete_statute(statute_id):
    response = supabase.table(STATUTORY_TABLE)\
        .delete()\
        .eq("id", statute_id)\
        .execute()

    return response.data


# ==========================================================
# 3️⃣ DAILY_TERM (TERM OF THE DAY)
# ==========================================================

def set_daily_term(legal_term, fixed_definition, simplified_definition):
    data = {
        "legal_term": legal_term,
        "Fixed Definition": fixed_definition,
        "Simplified Definition": simplified_definition
    }

    response = supabase.table(DAILY_TABLE).insert(data).execute()
    return response.data


def get_daily_term():
    response = supabase.table(DAILY_TABLE).select("*").execute()
    return response.data


def update_daily_term(legal_term, fixed_definition=None, simplified_definition=None):
    update_data = {}

    if fixed_definition:
        update_data["Fixed Definition"] = fixed_definition

    if simplified_definition:
        update_data["Simplified Definition"] = simplified_definition

    response = supabase.table(DAILY_TABLE)\
        .update(update_data)\
        .eq("legal_term", legal_term)\
        .execute()

    return response.data


def delete_daily_term(legal_term):
    response = supabase.table(DAILY_TABLE)\
        .delete()\
        .eq("legal_term", legal_term)\
        .execute()

    return response.data