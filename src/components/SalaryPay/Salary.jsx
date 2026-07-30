import React, { useState } from 'react';

function Salary() {
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'John Doe',
      designation: 'Senior Developer',
      department: 'Development',
      monthlySalary: 50000,
      lopDays: 0,
      clTaken: 0,
      isBestPerformer: false,
      joinedDate: '2024-01-15',
      salaryPaid: false,
      paymentDate: ''
    },
    {
      id: 2,
      name: 'Jane Smith',
      designation: 'Project Manager',
      department: 'Operations',
      monthlySalary: 75000,
      lopDays: 2,
      clTaken: 0,
      isBestPerformer: false,
      joinedDate: '2023-06-10',
      salaryPaid: false,
      paymentDate: ''
    },
    {
      id: 3,
      name: 'Mike Johnson',
      designation: 'Designer',
      department: 'Designer',
      monthlySalary: 45000,
      lopDays: 1,
      clTaken: 0,
      isBestPerformer: false,
      joinedDate: '2024-03-20',
      salaryPaid: false,
      paymentDate: ''
    },
    {
      id: 4,
      name: 'Sarah Williams',
      designation: 'SEO Specialist',
      department: 'Content',
      monthlySalary: 40000,
      lopDays: 0,
      clTaken: 0,
      isBestPerformer: false,
      joinedDate: '2024-05-01',
      salaryPaid: false,
      paymentDate: ''
    },
    {
      id: 5,
      name: 'Emily Davis',
      designation: 'SMM Expert',
      department: 'Media',
      monthlySalary: 42000,
      lopDays: 3,
      clTaken: 0,
      isBestPerformer: false,
      joinedDate: '2024-02-14',
      salaryPaid: false,
      paymentDate: ''
    }
  ]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [totalWorkingDays, setTotalWorkingDays] = useState(26);
  const [paymentData, setPaymentData] = useState({
    employeeId: null,
    paymentDate: '',
    lopDays: 0
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [];
  for (let i = 2020; i <= new Date().getFullYear() + 1; i++) {
    years.push(i);
  }

  const calculateSalary = (employee) => {
    const monthlySalary = employee.monthlySalary;
    
    // Formula 1: Per Day Salary = Monthly Salary / Total Working Days
    const perDaySalary = monthlySalary / totalWorkingDays;
    
    // Formula 2: LOP = Per Day Salary × Number of LOP Days
    const lopAmount = perDaySalary * (employee.lopDays || 0);
    
    // Formula 3: Monthly Net Salary = Monthly Salary - LOP
    const monthlyNetSalary = monthlySalary - lopAmount;
    
    // Conveyance Allowance fixed at 1600
    const conveyanceAllowance = 1600;
    
    // Formula 4: Basic Pay = Monthly Salary - (HRA + Conveyance Allowance)
    // HRA is 40% of Basic Pay
    let basicPay = 0;
    let hra = 0;
    
    if (monthlySalary > conveyanceAllowance) {
      basicPay = (monthlySalary - conveyanceAllowance) / 1.4;
      hra = basicPay * 0.4;
    } else {
      basicPay = monthlySalary;
      hra = 0;
    }
    
    basicPay = Math.round(basicPay * 100) / 100;
    hra = Math.round(hra * 100) / 100;
    
    // Best performer bonus (10% hike)
    let bonusAmount = 0;
    let finalSalary = monthlyNetSalary;
    
    if (employee.isBestPerformer) {
      bonusAmount = monthlyNetSalary * 0.10;
      finalSalary = monthlyNetSalary + bonusAmount;
    }

    return {
      perDaySalary: Math.round(perDaySalary * 100) / 100,
      lopAmount: Math.round(lopAmount * 100) / 100,
      monthlyNetSalary: Math.round(monthlyNetSalary * 100) / 100,
      basicPay: Math.round(basicPay * 100) / 100,
      hra: Math.round(hra * 100) / 100,
      conveyanceAllowance: conveyanceAllowance,
      bonusAmount: Math.round(bonusAmount * 100) / 100,
      finalSalary: Math.round(finalSalary * 100) / 100,
      isBestPerformer: employee.isBestPerformer
    };
  };

  const handleOpenPaymentModal = (employee) => {
    setPaymentData({
      employeeId: employee.id,
      paymentDate: new Date().toISOString().split('T')[0],
      lopDays: employee.lopDays || 0
    });
    setSelectedEmployee(employee);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = () => {
    const updatedEmployees = employees.map(emp => 
      emp.id === paymentData.employeeId ? { 
        ...emp, 
        salaryPaid: true, 
        paymentDate: paymentData.paymentDate,
        lopDays: parseInt(paymentData.lopDays) || 0
      } : emp
    );
    setEmployees(updatedEmployees);
    setShowPaymentModal(false);
    setSelectedEmployee(null);
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLopUpdate = (employeeId, days) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === employeeId ? { ...emp, lopDays: Math.max(0, parseInt(days) || 0) } : emp
    );
    setEmployees(updatedEmployees);
  };

  const handleViewSalary = (employee) => {
    setSelectedEmployee(employee);
    setShowSalaryModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    return status ? 
      'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium' : 
      'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
           
            <div className="flex gap-3 items-center flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Total Working Days Setting */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">📅 Total Working Days:</label>
              <input
                type="number"
                min="1"
                max="31"
                value={totalWorkingDays}
                onChange={(e) => setTotalWorkingDays(Math.max(1, parseInt(e.target.value) || 26))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm text-center"
              />
              <span className="text-xs text-gray-400">(Used for Per Day Salary calculation)</span>
            </div>
            <div className="text-sm text-gray-500 ml-4">
              <span className="font-medium">Formula:</span> Per Day Salary = Monthly Salary / {totalWorkingDays}
            </div>
          </div>
        </div>

        {/* Salary Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CL Taken</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOP Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => {
                  const salary = calculateSalary(employee);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                          <p className="text-xs text-gray-500">{employee.designation}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(employee.monthlySalary)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={employee.clTaken || 0}
                          onChange={(e) => {
                            const updatedEmployees = employees.map(emp => 
                              emp.id === employee.id ? { ...emp, clTaken: Math.max(0, parseInt(e.target.value) || 0) } : emp
                            );
                            setEmployees(updatedEmployees);
                          }}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={employee.lopDays || 0}
                          onChange={(e) => handleLopUpdate(employee.id, e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(salary.monthlyNetSalary)}</p>
                        {employee.isBestPerformer && (
                          <span className="text-xs text-green-600">+10% bonus</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadge(employee.salaryPaid)}>
                          {employee.salaryPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{employee.paymentDate || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewSalary(employee)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors"
                          >
                            View
                          </button>
                          {!employee.salaryPaid && (
                            <button
                              onClick={() => handleOpenPaymentModal(employee)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                            >
                              Pay Salary
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-gray-500">
              <span>Total Employees: {employees.length}</span>
              <span>Total Working Days: {totalWorkingDays}</span>
              <span>Total Salary: {formatCurrency(employees.reduce((sum, emp) => sum + calculateSalary(emp).monthlyNetSalary, 0))}</span>
              <span>Paid: {employees.filter(e => e.salaryPaid).length} / {employees.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowPaymentModal(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">💳 Process Payment</h2>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="space-y-4">
                  {/* Employee Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">{selectedEmployee.name}</p>
                    <p className="text-xs text-gray-500">{selectedEmployee.designation}</p>
                    <p className="text-xs text-gray-500">Monthly Salary: {formatCurrency(selectedEmployee.monthlySalary)}</p>
                    <p className="text-xs text-gray-500">Total Working Days: {totalWorkingDays}</p>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={paymentData.paymentDate}
                      onChange={handlePaymentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  {/* LOP Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LOP Days
                    </label>
                    <input
                      type="number"
                      name="lopDays"
                      min="0"
                      value={paymentData.lopDays}
                      onChange={handlePaymentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                      placeholder="Enter LOP days"
                    />
                  </div>

                  {/* Salary Preview with Formulas */}
                  {(() => {
                    const monthlySalary = selectedEmployee.monthlySalary;
                    const perDay = monthlySalary / totalWorkingDays;
                    const lopAmt = perDay * (parseInt(paymentData.lopDays) || 0);
                    const netSalary = monthlySalary - lopAmt;
                    const conveyance = 1600;
                    let basic = 0;
                    let hra = 0;
                    
                    if (monthlySalary > conveyance) {
                      basic = (monthlySalary - conveyance) / 1.4;
                      hra = basic * 0.4;
                    } else {
                      basic = monthlySalary;
                      hra = 0;
                    }
                    
                    return (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">📊 Salary Calculation</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monthly Salary:</span>
                            <span className="font-medium">{formatCurrency(monthlySalary)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Working Days:</span>
                            <span className="font-medium">{totalWorkingDays}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Per Day Salary (Monthly / {totalWorkingDays}):</span>
                            <span className="font-medium">{formatCurrency(perDay)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">LOP Days:</span>
                            <span className="font-medium">{paymentData.lopDays || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">LOP Amount (Per Day × LOP):</span>
                            <span className="font-medium text-red-600">{formatCurrency(lopAmt)}</span>
                          </div>
                          <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                            <span className="font-semibold text-gray-700">Net Salary (Salary - LOP):</span>
                            <span className="font-bold text-blue-700">{formatCurrency(netSalary)}</span>
                          </div>
                          <div className="flex justify-between mt-1 pt-1 border-t border-blue-200">
                            <span className="text-gray-600">Conveyance Allowance:</span>
                            <span className="font-medium">{formatCurrency(1600)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">HRA (40% of Basic):</span>
                            <span className="font-medium">{formatCurrency(hra)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Basic Pay (Monthly - HRA - Conveyance):</span>
                            <span className="font-medium">{formatCurrency(basic)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Details Modal */}
      {showSalaryModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowSalaryModal(false)}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">📄 Salary Details</h2>
                  <button
                    onClick={() => setShowSalaryModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-6">
                {(() => {
                  const salary = calculateSalary(selectedEmployee);
                  return (
                    <>
                      {/* Employee Info */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500">Employee Name</label>
                            <p className="text-sm font-medium text-gray-900">{selectedEmployee.name}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Designation</label>
                            <p className="text-sm text-gray-900">{selectedEmployee.designation}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Department</label>
                            <p className="text-sm text-gray-900">{selectedEmployee.department}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Status</label>
                            <p className="text-sm">
                              <span className={getStatusBadge(selectedEmployee.salaryPaid)}>
                                {selectedEmployee.salaryPaid ? 'Paid' : 'Pending'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Salary Breakdown with Formulas */}
                      <h3 className="text-md font-semibold text-gray-800 mb-4">📊 Salary Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Monthly Salary</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedEmployee.monthlySalary)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm text-gray-600">Total Working Days</span>
                          <span className="text-sm font-medium text-blue-700">{totalWorkingDays}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm text-gray-600">Per Day Salary (Monthly / {totalWorkingDays})</span>
                          <span className="text-sm font-medium text-blue-700">{formatCurrency(salary.perDaySalary)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <span className="text-sm text-gray-600">LOP Days</span>
                          <span className="text-sm font-medium text-red-600">{selectedEmployee.lopDays || 0} days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="text-sm text-gray-600">LOP Amount (Per Day × LOP Days)</span>
                          <span className="text-sm font-medium text-red-600">{formatCurrency(salary.lopAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm font-semibold text-gray-700">Monthly Net Salary (Salary - LOP)</span>
                          <span className="text-sm font-bold text-blue-700">{formatCurrency(salary.monthlyNetSalary)}</span>
                        </div>
                      </div>

                      <h3 className="text-md font-semibold text-gray-800 mt-6 mb-4">📋 Salary Components</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Conveyance Allowance</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(salary.conveyanceAllowance)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">HRA (40% of Basic)</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(salary.hra)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <span className="text-sm text-gray-600">Basic Pay (Monthly - HRA - Conveyance)</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(salary.basicPay)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">HRA + Conveyance + Basic</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(salary.basicPay + salary.hra + salary.conveyanceAllowance)}
                          </span>
                        </div>
                      </div>

                      {/* Best Performer Bonus */}
                      {salary.isBestPerformer && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-semibold text-green-700">🏆 Best Performer Bonus</span>
                              <p className="text-xs text-green-600">10% hike on net salary</p>
                            </div>
                            <span className="text-lg font-bold text-green-700">{formatCurrency(salary.bonusAmount)}</span>
                          </div>
                        </div>
                      )}

                      {/* Payment Status */}
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">💰 Final Salary</span>
                          <span className="text-xl font-bold text-gray-900">
                            {formatCurrency(salary.finalSalary)}
                            {salary.isBestPerformer && (
                              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">+10%</span>
                            )}
                          </span>
                        </div>
                        {selectedEmployee.salaryPaid && (
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                            <span className="text-sm text-gray-600">Payment Date</span>
                            <span className="text-sm font-medium text-gray-900">{selectedEmployee.paymentDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Close Button */}
                      <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowSalaryModal(false)}
                          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Salary;