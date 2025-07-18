# GitHub Repository and GitHub Pages Setup Guide

## Creating a GitHub Repository

1. Go to [GitHub](https://github.com/) and sign in to your account
2. Click on the '+' icon in the top right corner and select 'New repository'
3. Enter a repository name (e.g., 'fruit-catcher-game')
4. Add a description (optional): "A fun browser-based game where a boy catches falling fruits"
5. Choose 'Public' visibility
6. Check the box to initialize with a README (though we already have one)
7. Click 'Create repository'

## Pushing Your Local Repository to GitHub

After creating the repository on GitHub, run these commands in your terminal, replacing `YOUR_USERNAME` with your GitHub username and `REPO_NAME` with your repository name:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push your code to GitHub
git push -u origin main
```

## Setting Up GitHub Pages

1. Go to your repository on GitHub
2. Click on 'Settings' tab
3. Scroll down to the 'GitHub Pages' section
4. Under 'Source', select 'main' branch
5. Click 'Save'

After a few minutes, your game will be available at:
`https://YOUR_USERNAME.github.io/REPO_NAME/`

## Updating Your Game

Whenever you make changes to your game:

```bash
# Add all changed files
git add .

# Commit your changes
git commit -m "Description of your changes"

# Push to GitHub
git push
```

GitHub Pages will automatically update with your changes.

## Custom Domain (Optional)

If you want to use a custom domain:

1. Go to your repository settings
2. Scroll to the 'GitHub Pages' section
3. Under 'Custom domain', enter your domain name
4. Click 'Save'
5. Configure your domain's DNS settings as instructed by GitHub

## Troubleshooting

If your site doesn't appear after setting up GitHub Pages:
- Make sure your repository is public
- Check that the index.html file is in the root directory
- Wait a few minutes for GitHub to build and deploy your site
- Check the 'Actions' tab for any build errors