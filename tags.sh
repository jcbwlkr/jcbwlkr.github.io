languages=(go cassandra bash html5 javascript mongo mysql node php python ruby c++)
tools=(vim angular avalara bootstrap canvas doctrine express innodb jekyll jinja2 less phpunit rails regex silex soap symfony tmux twig)
concepts=(api community e-commerce oop presentation rest tdd)

for l in "${languages[@]}"; do
  sed -i -e "s/- ${l}\$/- language:${l}/" _data/**/*.yml
done
for l in "${tools[@]}"; do
  sed -i -e "s/- ${l}\$/- tool:${l}/" _data/**/*.yml
done
for l in "${concepts[@]}"; do
  sed -i -e "s/- ${l}\$/- concept:${l}/" _data/**/*.yml
done
