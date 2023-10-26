module.exports = {
  '*.{md,json,yaml,yml}': [`prettier -w`],
  '*.ts': ['organize-imports-cli', `prettier -w`, 'eslint'],
  '*.js': [`prettier -w`, 'eslint'],
};
