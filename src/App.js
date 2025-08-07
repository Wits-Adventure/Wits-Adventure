import logo from './logo.svg';
import './App.css';

const App = () => {
  //const { currentUser, userRole, loading } = useAuth();
  



  return (
    <>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<HomePage />} />
        <Route path="/Homepage" element={<HomePage />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        
      </Routes>
    </>
  );
};


export default App;
