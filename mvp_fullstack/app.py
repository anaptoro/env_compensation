from flask import Flask, request, send_from_directory, render_template, jsonify
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError

from model import Session, Produto
from model.comentario import Comentario

from model.utils import load_compensacao_from_csv_once
from model.compensation import Compensation

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template("home.html"), 200


@app.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'favicon.ico', mimetype='image/x-icon')

@app.before_first_request
def init_compensation():
    load_compensacao_from_csv_once()
    
@app.route('/api/municipios', methods=['GET'])
def listar_municipios():
    session = Session()
    rows = (
        session.query(Compensation.municipality)
        .distinct()
        .order_by(Compensation.municipality)
        .all()
    )
    municipios = [r[0] for r in rows]
    session.close()
    return jsonify({"municipios": municipios}), 200


@app.route('/api/compensacao/lote', methods=['POST'])
def calcular_compensacao_lote():
    data = request.get_json() or {}

    items = data.get("items")
    if not isinstance(items, list) or not items:
        return jsonify({"erro": "Envie uma lista 'items' com pelo menos um elemento"}), 400

    session = Session()

    resultados = []
    total_geral = 0
    itens_sem_regra = []

    for idx, item in enumerate(items):
        name = item.get("name")
        municipality = item.get("municipality")
        group = item.get("group")
        quantidade = item.get("quantidade")

        if not name or not municipality or quantidade is None:
            itens_sem_regra.append({
                "index": idx,
                "motivo": "Campos obrigatórios faltando (name, municipality, quantidade)",
                "item": item
            })
            continue

        try:
            quantidade = int(quantidade)
        except ValueError:
            itens_sem_regra.append({
                "index": idx,
                "motivo": "quantidade não é número inteiro",
                "item": item
            })
            continue

        query = session.query(Compensation).filter(
            Compensation.name == name,
            Compensation.municipality == municipality,
        )
        if group:
            query = query.filter(Compensation.group == group)

        regra = query.first()
        if not regra:
            itens_sem_regra.append({
                "index": idx,
                "motivo": "Nenhuma regra encontrada",
                "filtros_usados": {
                    "name": name,
                    "municipality": municipality,
                    "group": group
                }
            })
            continue

        total_item = quantidade * regra.compensation
        total_geral += total_item

        resultados.append({
            "name": name,
            "municipality": municipality,
            "group": group,
            "quantidade": quantidade,
            "compensacao_por_arvore": regra.compensation,
            "compensacao_total_item": total_item
        })

    session.close()

    return jsonify({
        "itens_processados": resultados,
        "total_compensacao_geral": total_geral,
        "itens_sem_regra": itens_sem_regra
    }), 200
