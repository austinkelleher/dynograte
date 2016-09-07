pushd .

cd docker

docker-compose down
docker-compose up -d

DOCKER_VM_IP=localhost

function find_service_port {
    service=$1
    port=$2
    docker-compose -f docker-compose.yml port $service $port | sed 's/.*:\([0-9][0-9]*\)$/\1/'
}

DOCKER_DYNAMO_DB_PORT=$(find_service_port dynamodb 8000)
DOCKER_DYNAMO_DB_URI=http://$DOCKER_VM_IP:$DOCKER_DYNAMO_DB_PORT

popd

echo $DOCKER_DYNAMO_DB_URI

echo "'use strict';

const aws = require('aws-sdk');

module.exports = {
  dynamodb: {
    region: 'us-east-1',
    endpoint: new aws.Endpoint('$DOCKER_DYNAMO_DB_URI')
  }
};" > config.js
