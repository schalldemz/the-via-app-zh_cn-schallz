const fs = require('fs');
const { exec } = require('child_process');

function buildDefinitions() {
  if (fs.existsSync('./public/definitions')) {
    return;
  }

  console.log('未找到定义. 构建中...');

  exec('via-keyboards public/definitions', (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return;
    }
     
    if (stderr) {
      console.error('stderr');
      return;
    }

    console.log(stdout);
  });
}

buildDefinitions();
