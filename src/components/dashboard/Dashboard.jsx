import {
  Users,
  UserRound,
  Trophy,
  Activity,
} from "lucide-react";

const stats = [
  {
    title: "TOTAL USERS",
    value: 5,
    icon: <Users size={28} className="text-blue-600" />,
    bg: "bg-blue-100",
  },
  {
    title: "TOTAL LEADS",
    value: 7,
    icon: <UserRound size={28} className="text-sky-500" />,
    bg: "bg-cyan-100",
  },
  {
    title: "CONVERTED DEALS",
    value: 0,
    icon: <Trophy size={28} className="text-green-600" />,
    bg: "bg-green-100",
  },
  {
    title: "ACTIVE USERS",
    value: 5,
    icon: <Activity size={28} className="text-yellow-500" />,
    bg: "bg-yellow-100",
  },
];

const users = [
  "Geetha",
  "Gokul",
  "Prabu",
  "Raja M",
  "System Admin",
];

const leads = [
  {
    company: "qwerty",
    client: "qwerty",
    budget: "₹50,000",
    status: "",
  },
  {
    company: "Flyi Toys",
    client: "client Name",
    budget: "₹0",
    status: "",
  },
  {
    company: "Webber",
    client: "John Doe",
    budget: "₹0",
    status: "",
  },
  {
    company: "Anugraha",
    client: "dummy",
    budget: "₹100,000",
    status: "Contacted",
  },
  {
    company: "ABC",
    client: "ABC",
    budget: "₹50,000",
    status: "Negotiation",
  },
];

export default function Dashboard() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Stats */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {stats.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-3xl shadow-sm p-6 flex items-center gap-5"
          >
            <div className={`${item.bg} p-5 rounded-2xl`}>
              {item.icon}
            </div>

            <div>
              <p className="text-gray-500 text-sm font-semibold">
                {item.title}
              </p>

              <h2 className="text-4xl font-bold mt-1">
                {item.value}
              </h2>
            </div>
          </div>
        ))}

      </div>

      {/* Tables */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

        {/* Recent Users */}

        <div className="bg-white rounded-3xl shadow-sm p-6">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Recent User Activity
            </h2>

            <button className="bg-gray-100 px-5 py-2 rounded-full">
              View All
            </button>
          </div>

          <table className="w-full">

            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>

            <tbody>

              {users.map((user) => (
                <tr key={user} className="border-b">

                  <td className="p-4">
                    {user}
                  </td>

                  <td className="p-4">

                    <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm">
                      ● Active
                    </span>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

        {/* Recent Leads */}

        <div className="bg-white rounded-3xl shadow-sm p-6">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold">
              Recent Leads
            </h2>

            <button className="bg-gray-100 px-5 py-2 rounded-full">
              View Pipeline
            </button>

          </div>

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="text-left p-3">
                  Company
                </th>

                <th className="text-left p-3">
                  Budget
                </th>

                <th className="text-left p-3">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {leads.map((lead, index) => (

                <tr key={index} className="border-b">

                  <td className="p-4">

                    <p className="font-medium">
                      {lead.company}
                    </p>

                    <p className="text-sm text-gray-500">
                      {lead.client}
                    </p>

                  </td>

                  <td className="p-4 font-bold">
                    {lead.budget}
                  </td>

                  <td className="p-4">

                    {lead.status ? (
                      <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm">
                        {lead.status}
                      </span>
                    ) : (
                      <div className="w-8 h-2 rounded-full bg-gray-200"></div>
                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}