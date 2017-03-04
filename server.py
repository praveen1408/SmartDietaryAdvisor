from neo4j.v1 import GraphDatabase, basic_auth
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

def getStringNeo4J():
    driver = GraphDatabase.driver("bolt://localhost", auth=basic_auth("neo4j", "foodstuff"))
    session = driver.session()

    query = "\
    MATCH (n) \
    WHERE rand() < 0.5 \
    RETURN n.id as id, n.name as name, n.class as class,\
    n.calorie as calorie,n.unit as unit\
    LIMIT 10;"

    result = session.run(query)

    response = []
    for record in result:
        row = {"id":record["id"],"name":record["name"],\
               "class":record["class"],"calorie":record["calorie"],\
               "unit":record["unit"]}
        response.append(row)
    session.close()    
    print(response)

    return json.dumps(response)

class myRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type','text/html')
        self.send_header('Access-Control-Allow-Origin' ,'*')
        self.end_headers()
        self.wfile.write(bytes(getStringNeo4J(),'utf8'))

def run():
    print('starting server...')
    server_address = ('127.0.0.1', 8081)
    httpd = HTTPServer(server_address, myRequestHandler)
    print('running server...')
    httpd.serve_forever()
    
run()


