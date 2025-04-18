#!/bin/bash

# Environment (dev or prod)
ENV=${1:-dev}
ENV_UPPER=$(echo $ENV | tr '[:lower:]' '[:upper:]')

# Directory to exclude from deployment
EXCLUDES=("_shared")

# Check if we need to bypass JWT verification
NO_JWT_FUNCS=("stripe-webhook")
root_dir=$(pwd)
function_dir="$root_dir/supabase/functions"

# Check if supabase directory exists
if [ ! -d "supabase" ]; then
  echo "❌ Error: supabase directory does not exist!"
  echo "Make sure you're running this script from the project root directory."
  exit 1
fi

# Create backup of original supabase directory
echo "📦 Creating backup of supabase directory..."
cp -r supabase supabase-tmp


# Navigate to functions directory
cd $function_dir

echo "🚀 Preparing functions for $ENV environment..."

for dir in */; do
  # Remove trailing slash
  dir=${dir%*/}
  
  # Skip excluded directories
  if [[ " ${EXCLUDES[@]} " =~ " ${dir} " ]]; then
    echo "⏭️  Skipping $dir (excluded directory)"
    continue
  fi
  
  # Set function name with environment prefix
  new_folder_name="$ENV-$dir"
  
  # Copy function code to the new directory
  mv "$dir" "$new_folder_name"
  
  # Replace placeholders with environment-specific values
  echo "🔄 Replacing placeholders in $new_folder_name with $ENV_UPPER environment values..."
  find "$new_folder_name" -type f -name "*.ts" -exec sed -i "" "s/__\([A-Z0-9_]*\)__/${ENV_UPPER}_\1/g" {} \;
  
  echo "📝 Prepared $new_folder_name"
done

echo "🚀 Deploying functions to $ENV environment..."

for dir in */; do
  # Remove trailing slash
  dir=${dir%*/}
  
  # Skip excluded directories
  if [[ " ${EXCLUDES[@]} " =~ " ${dir} " ]]; then
    continue
  fi
  
  # Check if dir starts with our environment prefix
  # Check if this function needs JWT verification disabled
  original_name=${dir#"$ENV-"}
  jwt_flag=""
  if [[ " ${NO_JWT_FUNCS[@]} " =~ " ${original_name} " ]]; then
    jwt_flag="--no-verify-jwt"
    echo "🔓 Deploying $dir with JWT verification disabled"
  else
    echo "🔒 Deploying $dir with JWT verification enabled"
  fi
  
  # Deploy the function
  # echo out the command
  cd $root_dir
  echo "npx supabase functions deploy $dir $jwt_flag --project-ref wnwyftlrmrtfkshyenlc"
  npx supabase functions deploy "$dir" $jwt_flag --project-ref "wnwyftlrmrtfkshyenlc"
  # cd $function_dir

  if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy $dir"
    
    # Return to project root
    cd $root_dir
    
    # Restore original supabase directory
    echo "🔄 Restoring original supabase directory..."
    rm -rf supabase
    mv supabase-tmp supabase
    
    exit 1
  else
    echo "✅ Successfully deployed $dir"
  fi
done

# Return to project root
cd $root_dir

# Restore original supabase directory
echo "🔄 Restoring original supabase directory..."
rm -rf supabase
mv supabase-tmp supabase

echo "✨ All functions deployed to $ENV environment" 