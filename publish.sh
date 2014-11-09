#!bash -ex

# Put this somewhere safe
cp -a _site /tmp

# Switch to the deployment branch
git checkout master

# Cleanse out what's here including hidden files (but not .git)
find . -mindepth 1 -maxdepth 1 -not -name ".git" -exec rm -rf {} \;

# Copy everything including hidden files from the generated _site folder
find /tmp/_site -mindepth 1 -maxdepth 1 -exec cp -a {} . \;

# Stage it all
git add -A

# Clean up
rm -rf /tmp/_site

# Commit
git commit -am "Site update for $(date)"

# Publish
git push origin master

# Go back to where we were
git checkout -
