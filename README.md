# hfNetworkGenerator
hyperledger fabric network generator

docker-compose version 1.24.0


download fabric 1.4.1
git clone https://github.com/hyperledger/fabric-samples/tree/v1.4.1


modify
conf.js


yarn --ignore-engines


yarn start new -o 2 -p 2 -c 2




sudo vi /etc/hosts
127.0.0.1       ca.org1.com
127.0.0.1       ca.org2.com



yarn start installcc -o 1 -p 0 -C 0 -n setcc -l node -v 1.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"
yarn start installcc -o 1 -p 1 -C 0 -n setcc -l node -v 1.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')" -i

docker exec -it cli bash

scripts/set-env.sh 0 1
peer chaincode query -C channel0 -n setcc -c '{"Args": ["queryAll"]}'

scripts/set-env.sh 1 1
peer chaincode query -C channel0 -n setcc -c '{"Args": ["queryAll"]}'

exit

yarn start installcc -o 1 -p 0 -C 0 -n setcc -l node -v 2.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"
yarn start installcc -o 1 -p 1 -C 0 -n setcc -l node -v 2.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"
yarn start upgradecc -o 1 -p 0 -C 0 -n setcc -l node -v 2.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"
yarn start upgradecc -o 1 -p 1 -C 0 -n setcc -l node -v 2.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"

docker exec -it cli bash

scripts/set-env.sh 0 1
peer chaincode query -C channel0 -n setcc -c '{"Args": ["queryAll"]}'

scripts/set-env.sh 1 1
peer chaincode query -C channel0 -n setcc -c '{"Args": ["queryAll"]}'

exit

composer-playground

yarn start clean



couchdb 접속
http://localhost:7053/_utils/