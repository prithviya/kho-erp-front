import AppLayout from "../components/layout/AppLayout";
const MainLayout = () => {
    return (
        <div className="flex">
            {/* <Sidebar /> */}
            <div className="flex-1 bg-gray-100 min-h-screen">
               <AppLayout />
            </div>
        </div>
    );
};
export default MainLayout;