set /p commit="commit info:
git add .
git commit -am "%commit%"
git push remote master:master
npm publish