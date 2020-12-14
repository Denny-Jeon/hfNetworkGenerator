[//]: # (SPDX-License-Identifier: MIT)

## Hyperledger Fabric Network Generator

Please visit the [installation instructions](http://hyperledger-fabric.readthedocs.io/en/latest/install.html)
to ensure you have the correct prerequisites installed. Please use the
version of the documentation that matches the version of the software you

# hfNetworkGenerator
hyperledger fabric network generator

docker-compose version 1.24.0 install
sudo curl -L https://github.com/docker/compose/releases/download/1.18.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-composer --version

# create folder
mkdir <project name>



# download and fabric install (1.4.1)
cd <project name>
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 1.4.1

# download and hyperledger-composer install (node version = 8)
npm install -g composer-cli@0.20.0
npm install -g composer-rest-server@0.20.0
npm install -g generator-hyperledger-composer@0.20.0
npm install -g yo
npm install -g composer-playground@0.20.0


# clone hfNetworkGenerator
git clone https://github.com/Denny-Jeon/hfNetworkGenerator.git

# yarn install
cd hfNetworkGenerator
npm install -g yarn


# modify block chain network
vi env/network.env


# install node_modules
yarn --ignore-engines


# start block chain network
yarn start new -o 2 -p 2 -c 2



sudo vi /etc/hosts
127.0.0.1       ca.org1.com
127.0.0.1       ca.org2.com



# test
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



# composer playground
composer-playground


# rest server start
composer-rest-server -c admin@sodas-medical -n never


# network clean
cd <project name>/hfNetworkGenerator
yarn start clean
 

# couchdb 접속
http://localhost:7053/_utils/