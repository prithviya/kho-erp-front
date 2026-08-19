const fs = require('fs');
let content = fs.readFileSync('src/components/cifForm/ciform.jsx', 'utf8');

// 1. Imports
content = content.replace(
  "import { useNavigate } from 'react-router-dom';",
  "import { useNavigate, useLocation } from 'react-router-dom';"
);
content = content.replace(
  "import jobOpeningServices from '../../services/opening.service';",
  "import jobOpeningServices from '../../services/opening.service';\nimport departmentService from '../../services/department.service';"
);

// 2. States and Hooks
content = content.replace(
  "  const navigate = useNavigate();\n  const [personalformData, setpersonalFormData] = useState({",
  `  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const jobIdParam = searchParams.get('job_id');

  const [personalformData, setpersonalFormData] = useState({`
);

content = content.replace(
  "  const [loadingJobs, setLoadingJobs] = useState(false);",
  `  const [loadingJobs, setLoadingJobs] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);`
);

// 3. fetchJobPositions & fetchDepartments & useEffect
content = content.replace(
  "    setJobPositions(activeJobs);\n  } catch (error) {",
  `    setJobPositions(activeJobs);
    
    if (jobIdParam) {
      setpersonalFormData(prev => ({ ...prev, appliedPosition: jobIdParam }));
    }
  } catch (error) {`
);

content = content.replace(
  "  useEffect(() => {\n    fetchJobPositions();\n  }, []);",
  `  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await departmentService.getDepartments();
      const deps = response?.data || response?.result || response || [];
      setDepartments(deps);
    } catch (error) {
      console.error('DEPARTMENT FETCH ERROR:', error);
      toast.error('Unable to load departments.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    fetchJobPositions();
    fetchDepartments();
  }, [jobIdParam]);`
);

// 4. Conditional Rendering
const listUI = `  if (!jobIdParam) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <img src={Logo} alt="Company Logo" className="mx-auto mb-4" style={{ width: '150px', height: 'auto' }} />
            <h1 className="text-3xl font-bold text-gray-900">Current Job Openings</h1>
            <p className="text-gray-500 mt-2">Find a role that suits you and apply today.</p>
          </div>

          {loadingJobs || loadingDepartments ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Loading openings...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {departments.length === 0 && <p className="text-center text-gray-500">No departments found.</p>}
              {departments.map((dept) => {
                const deptJobs = jobPositions.filter((job) => job.departmentId === dept.id);
                return (
                  <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-800">{dept.name}</h2>
                    </div>
                    <div className="p-6">
                      {deptJobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {deptJobs.map((job) => (
                            <div key={job.jobid} className="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all bg-white flex flex-col justify-between">
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{job.jobTitle}</h3>
                                <p className="text-sm text-gray-600 mb-2">Code: {job.code}</p>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={job.requiredSkills}>
                                  <span className="font-medium">Skills:</span> {job.requiredSkills || 'N/A'}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
                                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {job.minExperience} Yrs Exp
                                </span>
                                <button
                                  onClick={() => navigate(\`/cif-form?job_id=\${job.jobid}\`)}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  Apply Now
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic text-center py-4">Sorry, no job openings here</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">`;

content = content.replace(
  "  return (\n    <div className=\"min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8\">",
  listUI
);

// 5. Select dropdown disable
content = content.replace(
  "                    disabled={loadingJobs}\n                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"",
  "                    disabled={!!jobIdParam || loadingJobs}\n                    className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed\""
);

fs.writeFileSync('src/components/cifForm/ciform.jsx', content);
console.log('Update successful!');
