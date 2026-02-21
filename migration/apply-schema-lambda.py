#!/usr/bin/env python3
"""
Script para aplicar schema a Aurora desde Lambda
Alternativa: ejecutar localmente con Python
"""

import psycopg2
import sys

# Configuración
DB_HOST = "happyhub-db-cluster.cluster-c8y9z8y1degk.eu-west-1.rds.amazonaws.com"
DB_PORT = 5432
DB_NAME = "happyhub"
DB_USER = "dbadmin"
DB_PASSWORD = "c0MAkvDuZ6yWhfUUzgMh"

def apply_schema():
    try:
        # Conectar
        print("🔌 Conectando a Aurora...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        print("✅ Conectado")

        # Leer y aplicar schema
        print("📝 Aplicando schema...")
        with open('migration/schema-simple.sql', 'r') as f:
            schema_sql = f.read()
            cursor.execute(schema_sql)

        conn.commit()
        print("✅ Schema aplicado")

        # Leer y aplicar seed data
        print("🌱 Aplicando seed data...")
        with open('migration/seed-data.sql', 'r') as f:
            seed_sql = f.read()
            cursor.execute(seed_sql)

        conn.commit()
        print("✅ Seed data aplicado")

        # Verificar
        cursor.execute("SELECT COUNT(*) FROM users")
        users = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM event_types")
        events = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM providers")
        providers = cursor.fetchone()[0]

        print(f"\n✅ Verificación:")
        print(f"   Users: {users}")
        print(f"   Event Types: {events}")
        print(f"   Providers: {providers}")

        cursor.close()
        conn.close()
        print("\n🎉 ¡TODO COMPLETADO!")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    apply_schema()
