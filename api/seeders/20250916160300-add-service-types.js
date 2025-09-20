export default {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("ServiceTypes", [
      {
        name: "Cooking",
        icon: "https://cdn.shopify.com/s/files/1/1186/5476/files/LIFESTYLE_2000x2000_48e752d7-2561-4472-831d-f164a3ea7405_1024x1024.jpg?v=1565717897",
      },
      {
        name: "Cleaning",
        icon: "https://greenlandfacilities.com/wp-content/uploads/2023/11/CJF8908-1.jpg",
      },
      {
        name: "Laundry",
        icon: "https://tumbledry.in/wp-content/uploads/2022/09/01-feature-Image-copy-5.jpg",
      },
      {
        name: "Utensils",
        icon: "https://images-cdn.ubuy.co.in/689fdf9913552c042402a866-18-10-stainless-steel-kitchen-utensils.jpg",
      },
      {
        name: "Home Care",
        icon: "https://www.gknmhospital.org/Backend/public//images/specialities/overview/2025/03/home-health-care-overview.webp",
      },
      {
        name: "Baby Care",
        icon: "https://images.pexels.com/photos/7282927/pexels-photo-7282927.jpeg",
      },
      {
        name: "Massage Lady",
        icon: "https://previews.123rf.com/images/vadimgozhda/vadimgozhda1503/vadimgozhda150301893/38288261-female-asian-masseur-doing-back-massage-on-man-body-and-looking-at-camera-in-the-spa-salon.jpg",
      },
      {
        name: "Caretake",
        icon: "https://vcareathome.com/wp-content/uploads/2025/05/Caretaker--1024x576.png",
      },
      {
        name: "Gardener",
        icon: "https://www.epicgardening.com/wp-content/uploads/2024/05/budget-gardening.jpeg",
      },
      {
        name: "Driver",
        icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYDVolGOtLolm6wF7Vu2-Y3nmTq3-QNqVfww&s",
      },
      {
        name: "Electrician",
        icon: "https://contractortrainingcenter.com/cdn/shop/articles/Untitled_design_1.png?v=1693506427&width=1100",
      },
      {
        name: "Plumber",
        icon: "https://metropha.com/wp-content/uploads/2018/09/Metro-Plumbing-_-6-Characteristics-That-An-Emergency-Plumber-In-Chattanooga-TN-Must-Have.jpg",
      },
      {
        name: "Security Guard",
        icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEwAAxcdIOIFgYcTip7hs_tP4oQ-w5B1Bs6g&s",
      },
      {
        name: "Beautician",
        icon: "https://media.istockphoto.com/id/1497806504/photo/hair-styling-in-beauty-salon-woman-does-her-hair-in-modern-beauty-salon-woman-stylist-dries.jpg?s=612x612&w=0&k=20&c=3dO_HWS8WvSGNbGmxTsqK70vZMGqM2REnbVJG09YnmI=",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("ServiceTypes", null, {});
  },
};
