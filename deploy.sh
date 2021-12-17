sudo systemctl stop lavlusd
cd ~/ServerApp/lavlus_server
git pull
npm install 
sed -i "s/192.168.1.200/127.0.0.1/g" src/datasources/db.datasource.ts
sudo systemctl start lavlusd