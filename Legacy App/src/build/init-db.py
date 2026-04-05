import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def main():
    # todo; build con string from env
    # db should be running on localhost:5432 for now
    con = psycopg2.connect(dbname='postgres',
                            user='root', 
                            password='password',
                            host='127.0.0.1',
                            port='5432')

    con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    cur = con.cursor()

    # Use the psycopg2.sql module instead of string concatenation 
    # in order to avoid sql injection attacks.
    cur.execute(sql.SQL("CREATE DATABASE {}").format(
            sql.Identifier("SOC"))
        )


if __name__=="__main__":
    main()