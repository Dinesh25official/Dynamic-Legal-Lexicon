from flask import Flask, request, jsonify

# Import admin services
from modules.admin.admin_service import (
    add_legal_term,
    get_all_legal_terms,
    get_legal_term_by_name,
    update_legal_term,
    delete_legal_term,

    add_statute,
    get_statutes_by_term,
    update_statute,
    delete_statute,

    set_daily_term,
    get_daily_term,
    update_daily_term,
    delete_daily_term
)

app = Flask(__name__)

# ==========================================================
# HOME
# ==========================================================

@app.route("/")
def home():
    return jsonify({
        "message": "Admin API Running Successfully"
    })


# ==========================================================
# LEGAL TERMS ROUTES
# ==========================================================

# ADD legal term
@app.route("/admin/terms/add", methods=["POST"])
def route_add_legal_term():

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON received"}), 400

        legal_term = data.get("legal_term")
        oxford_definition = data.get("oxford_definition")
        simplified_definition = data.get("simplified_definition")

        if not legal_term or not oxford_definition or not simplified_definition:
            return jsonify({"error": "Missing required fields"}), 400

        result = add_legal_term(
            legal_term,
            oxford_definition,
            simplified_definition
        )

        return jsonify({
            "message": "Legal term added successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET all legal terms
@app.route("/admin/terms", methods=["GET"])
def route_get_all_terms():

    try:
        result = get_all_legal_terms()
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET single term
@app.route("/admin/terms/<legal_term>", methods=["GET"])
def route_get_term(legal_term):

    try:
        result = get_legal_term_by_name(legal_term)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# UPDATE legal term
@app.route("/admin/terms/update", methods=["PUT"])
def route_update_term():

    try:
        data = request.get_json()

        legal_term = data.get("legal_term")

        if not legal_term:
            return jsonify({"error": "legal_term required"}), 400

        result = update_legal_term(
            legal_term,
            data.get("oxford_definition"),
            data.get("simplified_definition")
        )

        return jsonify({
            "message": "Legal term updated successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE legal term
@app.route("/admin/terms/delete/<legal_term>", methods=["DELETE"])
def route_delete_term(legal_term):

    try:
        result = delete_legal_term(legal_term)

        return jsonify({
            "message": "Legal term deleted successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# STATUTORY TABLE ROUTES
# ==========================================================

# ADD statute
@app.route("/admin/statutes/add", methods=["POST"])
def route_add_statute():

    try:
        data = request.get_json()

        result = add_statute(
            data.get("legal_term"),
            data.get("statute_name"),
            data.get("section"),
            data.get("description"),
            data.get("url")
        )

        return jsonify({
            "message": "Statute added successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET statutes by legal term
@app.route("/admin/statutes/<legal_term>", methods=["GET"])
def route_get_statutes(legal_term):

    try:
        result = get_statutes_by_term(legal_term)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# UPDATE statute
@app.route("/admin/statutes/update", methods=["PUT"])
def route_update_statute():

    try:
        data = request.get_json()

        statute_id = data.get("id")

        if not statute_id:
            return jsonify({"error": "id required"}), 400

        result = update_statute(
            statute_id,
            data.get("statute_name"),
            data.get("section"),
            data.get("description"),
            data.get("url")
        )

        return jsonify({
            "message": "Statute updated successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE statute
@app.route("/admin/statutes/delete/<int:statute_id>", methods=["DELETE"])
def route_delete_statute(statute_id):

    try:
        result = delete_statute(statute_id)

        return jsonify({
            "message": "Statute deleted successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# DAILY TERM ROUTES
# ==========================================================

# SET daily term
@app.route("/admin/daily/set", methods=["POST"])
def route_set_daily_term():

    try:
        data = request.get_json()

        result = set_daily_term(
            data.get("legal_term"),
            data.get("fixed_definition"),
            data.get("simplified_definition")
        )

        return jsonify({
            "message": "Daily term set successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET daily term
@app.route("/admin/daily", methods=["GET"])
def route_get_daily_term():

    try:
        result = get_daily_term()
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# UPDATE daily term
@app.route("/admin/daily/update", methods=["PUT"])
def route_update_daily():

    try:
        data = request.get_json()

        result = update_daily_term(
            data.get("legal_term"),
            data.get("fixed_definition"),
            data.get("simplified_definition")
        )

        return jsonify({
            "message": "Daily term updated successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE daily term
@app.route("/admin/daily/delete/<legal_term>", methods=["DELETE"])
def route_delete_daily(legal_term):

    try:
        result = delete_daily_term(legal_term)

        return jsonify({
            "message": "Daily term deleted successfully",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# RUN SERVER
# ==========================================================

if __name__ == "__main__":
    print("Admin API Running Successfully")
    app.run(debug=True)