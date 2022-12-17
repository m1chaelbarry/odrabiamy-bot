#!/bin/bash

# Install Node.js
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pm2
sudo npm install pm2 -g

# Install jq
sudo apt-get install jq

# Run npm install
npm install

# Check if odrabiamy token exists
if [ ! -f odrabiamytoken.txt ]; then
  # Prompt user for email and password
  read -p "Enter your email: " email
  read -s -p "Enter your password: " password

  # Send POST request to get odrabiamy token
  token=$(curl -X POST -H "Content-Type: application/json" -d "{\"login\":\"$email\",\"password\":\"$password\"}" https://odrabiamy.pl/api/v2/sessions | jq -r '.token')

  # Add odrabiamy token to file
  echo $token > odrabiamytoken.txt
fi

# Check if Discord bot token exists
if [ ! -f discordbottoken.txt ]; then
  # Prompt user for Discord bot token
  read -p "Enter your Discord bot token: " discord_bot_token

  # Add Discord bot token to file
  echo $discord_bot_token > discordbottoken.txt
fi

# Check if guild IDs file exists
if [ ! -f guildids.txt ]; then
  # Prompt user for guild IDs
  read -p "Enter your guild IDs (separated by space): " guild_ids

  # Add guild IDs to file
  echo $guild_ids > guildids.txt
fi

# Save tokens and guild IDs to config.ts
echo "export default {" > src/config.ts
echo "  token: '$(cat discordbottoken.txt)'," >> src/config.ts
echo "  channels: [" >> src/config.ts
while read -r guild_id; do
  echo "    '$guild_id'," >> src/config.ts
done < guildids.txt
echo "  ]," >> src/config.ts
echo "  odrabiamyAuth: '$(cat odrabiamytoken.txt)'" >> src/config.ts
echo "}" >> src/config.ts

# Run npm run build
npm run build

# Run pm2 start
pm2 start dist/main.js
