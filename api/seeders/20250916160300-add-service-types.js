export default {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("ServiceTypes", [
      {
        name: "Cooking",
        icon: "https://cdn-icons-png.flaticon.com/128/1046/1046784.png",
      },
      {
        name: "Cleaning",
        icon: "https://cdn-icons-png.flaticon.com/128/3075/3075977.png",
      },
      {
        name: "Laundry",
        icon: "https://cdn-icons-png.flaticon.com/128/888/888888.png",
      },
      {
        name: "Utensils",
        icon: "https://cdn-icons-png.flaticon.com/128/1046/1046785.png",
      },
      {
        name: "Home Care",
        icon: "https://cdn-icons-png.flaticon.com/128/3081/3081560.png",
      },
      {
        name: "Baby Care",
        icon: "https://cdn-icons-png.flaticon.com/128/3064/3064197.png",
      },
      {
        name: "Massage Lady",
        icon: "https://cdn-icons-png.flaticon.com/128/2921/2921822.png",
      },
      {
        name: "Caretake",
        icon: "https://cdn-icons-png.flaticon.com/128/1077/1077063.png",
      },
      {
        name: "Gardener",
        icon: "https://cdn-icons-png.flaticon.com/128/616/616408.png",
      },
      {
        name: "Driver",
        icon: "https://cdn-icons-png.flaticon.com/128/685/685352.png",
      },
      {
        name: "Electrician",
        icon: "https://cdn-icons-png.flaticon.com/128/742/742750.png",
      },
      {
        name: "Plumber",
        icon: "https://cdn-icons-png.flaticon.com/128/2921/2921821.png",
      },
      {
        name: "Security Guard",
        icon: "https://cdn-icons-png.flaticon.com/128/3003/3003290.png",
      },
      {
        name: "Beautician",
        icon: "https://cdn-icons-png.flaticon.com/128/2965/2965567.png",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("ServiceTypes", null, {});
  },
};
