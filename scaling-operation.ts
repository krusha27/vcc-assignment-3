import { execSync } from "child_process";

const VM_NAME = "instance-template-20260228-20260329-130034";
const ZONE = "us-central1-a";
const NGINX_CONFIG = "/etc/nginx/sites-enabled/load.conf";
const CLOUD_IP = "34.42.246.189";

export async function scaleUp() {
  console.log("Starting GCP VM...");
  updateLoad("add");
  execSync(`gcloud compute instances start ${VM_NAME} --zone=${ZONE}`);
}

export async function scaleDown() {
  console.log("Stopping GCP VM...");
  updateLoad("remove");
  execSync(`gcloud compute instances stop ${VM_NAME} --zone=${ZONE}`);
}

function updateLoad(operation: string) {
  console.log(`Updating load to ${operation} VM`);

  const includeGCP = operation === "add";

  const config = `
upstream backend {
    server 127.0.0.1:3000;
    ${includeGCP ? `server ${CLOUD_IP}:3000;` : ""}
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
    }
}
`;

  console.log("New config:\n", config);

  execSync(`echo '${config}' | sudo tee /etc/nginx/sites-enabled/load.conf`);
  execSync(`sudo nginx -t`);
  execSync(`sudo systemctl reload nginx`);
}
