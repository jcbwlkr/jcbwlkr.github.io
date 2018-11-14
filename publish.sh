#!bash -ex

# Clone the deploy branch
rm -rf public
git clone --depth=3 --branch=master https://github.com/jcbwlkr/jcbwlkr.github.io.git public

# Cleanse out what's there including hidden files (but not .git). Ideally we'd
# just use hugos flag to clean the destination dir but it would wipe out the
# .git folder too
find public -mindepth 1 -maxdepth 1 -not -name ".git" -exec rm -rf {} \;

# Generate the updated site
hugo -d public

# Stage, commit, and push
cd public
git status
git add -A
git commit -am "Site update for $(date)"
git push origin master

cd ..
