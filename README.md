# hfNetworkGenerator
hyperledger fabric network generator


yarn --ignore-engines


yarn start new -o 2 -p 2 -c 2
yarn start installcc -o 1 -p 0 -C 1 -n setcc -l node -v 1.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"
yarn start installcc -o 1 -p 1 -C 1 -n setcc -l node -v 1.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')" -i

docker exec -it cli bash

scripts/set-env.sh 0 1
peer chaincode query -C channel1 -n setcc -c '{"Args": ["queryAll"]}'

scripts/set-env.sh 1 1
peer chaincode query -C channel1 -n setcc -c '{"Args": ["queryAll"]}'

exit

yarn start installcc -o 1 -p 0 -C 1 -n setcc -l node -v 2.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"
yarn start installcc -o 1 -p 1 -C 1 -n setcc -l node -v 2.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"
yarn start upgradecc -o 1 -p 1 -C 1 -n setcc -l node -v 2.0 -c '{"Args":["initLedger"]}' -y "AND ('org1MSP.peer')"

docker exec -it cli bash

scripts/set-env.sh 0 1
peer chaincode query -C channel1 -n setcc -c '{"Args": ["queryAll"]}'

scripts/set-env.sh 1 1
peer chaincode query -C channel1 -n setcc -c '{"Args": ["queryAll"]}'

exit

composer-playground

yarn start clean