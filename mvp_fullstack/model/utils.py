import csv
from pathlib import Path
from model import Session
from model.compensation import Compensation


def load_compensacao_from_csv_once(force: bool = False):
    session = Session()

    # se não for force e já tiver dados, não recarrega
    if not force and session.query(Compensation).first():
        session.close()
        return

    csv_path = Path(".") / "federal_compensation.csv"
    if not csv_path.exists():
        print("No compensation file, skipping")
        session.close()
        return

    if force:
        session.query(Compensation).delete()
        session.commit()

    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append(
                Compensation(
                    name=row["name"].strip(),
                    group=row["group"].strip(),
                    municipality=row["municipality"].strip(),
                    compensation=int(row["compensation"])
                )
            )

    session.add_all(rows)
    session.commit()
    session.close()
    print("Compensation table loaded from CSV")
