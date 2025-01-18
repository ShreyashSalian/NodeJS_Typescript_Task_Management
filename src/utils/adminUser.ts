interface AdminUser {
  fullName: string;
  email: string;
  password: string;
  userName: string;
  role: string;
}

//Admin list
export const adminUserList: AdminUser[] = [
  {
    fullName: "Shreyash Salian",
    email: "shreyashsalian.alitainfotech@gmail.com",
    password: "Admin@123",
    userName: "ShreyashSalian",
    role: "admin",
  },
  {
    fullName: "Admin Admin",
    email: "u70siiqjv@tempmail.cc",
    password: "Admin@123",
    userName: "AdminAdmin",
    role: "admin",
  },
];
