const { env } = require('../src/config/config');
const { connect } = require('../src/config/database');
const { User, Role, Article } = require('../src/models');

const undo = async () => {
  /* eslint-disable*/
  if (env === "development") {
    console.log("=============== Clearing database ===============");
    await Role.deleteMany();
    await User.deleteMany();
    await Article.deleteMany();
    console.log("============= Cleared successfully ==============");
    process.exit(0);
  } else {
    console.log("Can only undo seed in development!");
    process.exit(1);
  }
};

connect(async () => {
  await undo();
});
