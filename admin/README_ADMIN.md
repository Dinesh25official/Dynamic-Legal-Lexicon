Dynamic Legal Lexicon — Admin Module

Admin API Endpoints:

1. Get all legal terms
   GET /admin/terms

2. Get single legal term
   GET /admin/terms/<legal_term>

Example:
GET /admin/terms/Mens Rea



3. Add new legal term
   POST /admin/terms/add

Body:
{
"legal_term": "Mens Rea",
"oxford_definition": "The intention or knowledge of wrongdoing.",
"simplified_definition": "Criminal intent or guilty mind."
}



4. Update legal term
   PUT /admin/terms/update

Body:
{
"legal_term": "Mens Rea",
"simplified_definition": "Updated simplified meaning"
}



5. Delete legal term
   DELETE /admin/terms/delete/<legal_term>

Example:
DELETE /admin/terms/delete/Mens Rea


## STATUTORY TABLE (Statutes linked to legal terms)

6. Get statutes by legal term
   GET /admin/statutes/<legal_term>

Example:
GET /admin/statutes/Murder

---

7. Add statute
   POST /admin/statutes/add

Body:
{
"legal_term": "Murder",
"statute_name": "Indian Penal Code",
"section": "Section 300",
"description": "Definition of murder",
"url": "https://example.com"
}

---

8. Update statute
   PUT /admin/statutes/update

Body:
{
"id": 1,
"description": "Updated statute description"
}



9. Delete statute
   DELETE /admin/statutes/delete/<id>

Example:
DELETE /admin/statutes/delete/1


## DAILY TERM (Term of the Day Feature)

10. Get daily term
    GET /admin/daily



11. Set daily term
    POST /admin/daily/set

Body:
{
"legal_term": "Actus Reus",
"fixed_definition": "The physical act of committing a crime.",
"simplified_definition": "The actual criminal act."
}

---

12. Update daily term
    PUT /admin/daily/update

Body:
{
"legal_term": "Actus Reus",
"simplified_definition": "Updated daily meaning"
}



13. Delete daily term
    DELETE /admin/daily/delete/<legal_term>

Example:
DELETE /admin/daily/delete/Actus Reus



## Tech Used

* Python
* Flask
* Supabase
* PostgreSQL
* REST API



## Purpose

Allows Admin to manage:

• Legal terms glossary
• Statutory references
• Daily term feature

Provides full CRUD operations and database control.

