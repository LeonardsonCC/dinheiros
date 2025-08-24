#!/bin/bash

# Function to check workflow status
check_workflow_status() {
    local tag=$1
    echo "Checking workflow status for tag: $tag"
    
    # Wait a moment for the workflow to be triggered
    echo "Waiting for workflow to start..."
    sleep 5
    
    # Get the latest workflow runs
    local max_attempts=60  # Wait up to 10 minutes (60 * 10 seconds)
    local attempt=0
    local workflow_found=false
    
    while [ $attempt -lt $max_attempts ]; do
        # Get workflow runs and check if any are running for our commit
        local git_commit=$(git rev-parse HEAD)
        local workflow_status=$(gh run list --workflow "publish.yml" --limit 10 --json status,conclusion,headSha,event,createdAt --jq ".[] | select(.headSha == \"$git_commit\" and .event == \"push\") | {status: .status, conclusion: .conclusion, createdAt: .createdAt}")
        
        if [ -n "$workflow_status" ]; then
            workflow_found=true
            local status=$(echo "$workflow_status" | jq -r '.status')
            local conclusion=$(echo "$workflow_status" | jq -r '.conclusion')
            
            echo "Workflow status: $status"
            
            if [ "$status" = "completed" ]; then
                if [ "$conclusion" = "success" ]; then
                    echo "✅ Workflow completed successfully!"
                    return 0
                else
                    echo "❌ Workflow failed with conclusion: $conclusion"
                    echo "Run 'gh run list' to see more details"
                    return 1
                fi
            elif [ "$status" = "in_progress" ] || [ "$status" = "queued" ]; then
                echo "⏳ Workflow is still running... (attempt $((attempt + 1))/$max_attempts)"
                sleep 10
            else
                echo "⚠️  Workflow status: $status"
                sleep 10
            fi
        else
            echo "⏳ Waiting for workflow to be triggered... (attempt $((attempt + 1))/$max_attempts)"
            sleep 10
        fi
        
        attempt=$((attempt + 1))
    done
    
    if [ "$workflow_found" = false ]; then
        echo "⚠️  No workflow found for this commit. Make sure you have workflows configured for push events."
        return 2
    else
        echo "⏰ Timeout: Workflow is taking longer than expected"
        return 3
    fi
}

# Main script starts here
echo "🏷️  Starting tag creation process..."

# Get highest tag number
VERSION=`git describe --abbrev=0 --tags`
# Replace . with space so can split into an array
VERSION_BITS=(${VERSION//./ })
# Get number parts and increase last one by 1
VNUM1=${VERSION_BITS[0]}
VNUM2=${VERSION_BITS[1]}
VNUM3=${VERSION_BITS[2]}
VNUM3=$((VNUM3+1))
# Create new tag
NEW_TAG="$VNUM1.$VNUM2.$VNUM3"
echo "Updating $VERSION to $NEW_TAG"

# Get current hash and see if it already has a tag
GIT_COMMIT=`git rev-parse HEAD`
NEEDS_TAG=`git describe --contains $GIT_COMMIT 2>/dev/null`

# Only tag if no tag already
if [ -z "$NEEDS_TAG" ]; then
    # Check if gh CLI is installed and authenticated
    if ! command -v gh &> /dev/null; then
        echo "❌ GitHub CLI (gh) is not installed. Please install it to use workflow monitoring."
        echo "   Visit: https://cli.github.com/"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        echo "❌ GitHub CLI is not authenticated. Please run 'gh auth login' first."
        exit 1
    fi
    
    # Create and push tag
    git tag $NEW_TAG
    echo "✅ Tagged with $NEW_TAG"
    git push --tags
    echo "✅ Tags pushed to remote"
    
    # Check workflow status
    echo ""
    echo "🔍 Monitoring workflow status..."
    check_workflow_status $NEW_TAG
    workflow_exit_code=$?
    
    case $workflow_exit_code in
        0)
            echo ""
            echo "🎉 Tag $NEW_TAG created and workflow completed successfully!"
            ;;
        1)
            echo ""
            echo "💥 Tag $NEW_TAG created but workflow failed!"
            echo "   Check the workflow logs with: gh run list"
            exit 1
            ;;
        2)
            echo ""
            echo "⚠️  Tag $NEW_TAG created but no workflow was triggered."
            echo "   This might be normal if you don't have workflows configured for tags/push events."
            ;;
        3)
            echo ""
            echo "⏰ Tag $NEW_TAG created but workflow monitoring timed out."
            echo "   Check workflow status manually with: gh run list"
            ;;
    esac
    
else
    echo "Already a tag on this commit"
fi

echo ""
echo "✨ Script completed!"
