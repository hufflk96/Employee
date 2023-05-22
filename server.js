//importing inquirer
const inquirer = require('inquirer'); 
//importing mysql
const mysql = require('mysql2');
//importing console.table
const cTable = require('console.table');
//importing colors to stylize the console 
var colors = require('colors');
var colors = require('colors/safe');

require('dotenv').config();

//connecting to sql database
const db = mysql.createConnection(
    {
    host: 'localhost',
      // MySQL username,
    user: 'root',
      // MySQL password - password protected by .env
    password: process.env.DB_PASSWORD,
    database: 'employee_db'
    },
    console.log(`Connected to the courses_db database.`),
);

db.connect(function(error) {
    if(error) throw error;
    console.log("connected at " + db.threadID+"\n");
    promptUser();
})

//setting up inquirer prompts for the user to answer
const promptUser = () => {
    return inquirer.prompt ([
        {
            type: 'list',
            name: 'choices',
            message: 'Please choose a task',
            choices: ['View all departments',
                    'View all roles',
                    'View all employees',
                    'Add a department',
                    'Add a role',
                    'Add an employee',
                    'Update an employee role',
                    'Update an employee manager',
                    'View all employees by manager',
                    'View all employees by department',
                    "View budget",
                    "Delete department",
                    "Delete role",
                    "Delete employee",
                    'Quit']
        }
    ])
    .then((answers) => {
        const { choices } = answers;
        if (choices === "View all departments") {
            showDepartments();
        }

        if (choices === "View all roles") {
            showRoles();
        }

        if (choices === "View all employees") {
            showEmployees();
        }

        if (choices === "Add a department") {
            addDepartment();
        }

        if (choices === "Add a role") {
            addRole();
        }

        if (choices === "Add an employee") {
            addEmployee();
        }

        if (choices === "Update an employee role") {
            updateRole();
        }

        if (choices === "Update an employee manager") {
            updateManager();
        }
        if (choices === "View all employees by manager"){
            viewManager();
        }

        if (choices === "View all employees by department") {
            viewDepartment();
        }

        if (choices === "View budget") {
            viewBudget();
        }

        if (choices === "Delete department") {
            deleteDept();
        }

        if (choices === "Delete role") {
            deleteRole();
        }
        
        if (choices === "Delete employee") {
            deleteEmp();
        }

        if (choices === "Quit") {
            db.end();
        }


    }) 
}

//defining functions to go with user choices

//function will show all departments (Department ID, and department name) when selected
function showDepartments(){

    const mySql = `SELECT department.id AS id, department.name AS name FROM department`; 

    db.query(mySql, (err, results) => {
        if (err) throw err;
        console.log("----------------------------------------------".rainbow);
        console.log("Showing all Departments".bold.cyan);
        console.log("----------------------------------------------".rainbow);
        console.table(results);
        console.log("----------------------------------------------".rainbow);
        promptUser();
    });
};

//function will show all roles when selected.  (will show role id, title, department name, and salary)
function showRoles(){

    const mySql = `SELECT role.id, role.title, department.name AS department, role.salary 
                FROM role
                INNER JOIN department ON role.department_id = department.id`;
    
    db.query(mySql, (err, results) => {
        if (err) throw err; 
        console.log("----------------------------------------------".rainbow);
        console.log("Showing all Roles".bold.cyan);
        console.log("----------------------------------------------".rainbow);
        console.table(results); 
        console.log("----------------------------------------------".rainbow);
        promptUser();
    })
};

//function will show all employees when selected 
function showEmployees(){

    const mySql = `SELECT employee.id, 
                employee.first_name, 
                employee.last_name, 
                role.title, 
                department.name AS department,
                role.salary, 
                CONCAT (manager.first_name, " ", manager.last_name) AS manager
                FROM employee
                LEFT JOIN role ON employee.role_id = role.id
                LEFT JOIN department ON role.department_id = department.id
                LEFT JOIN employee manager ON employee.manager_id = manager.id`;

    db.query(mySql, (err, results) => {
        if (err) throw err; 
        console.log("----------------------------------------------".rainbow);
        console.log("Showing all employees".bold.cyan);
        console.log("----------------------------------------------".rainbow);
        console.table(results);
        console.log("----------------------------------------------".rainbow);
        promptUser();
    });
};

//function will add a new department to the DB
function addDepartment(){
    inquirer.prompt([
        {
            type: 'input', 
            name: 'addDept',
            message: "Please add a department",
        }
    ])
        .then(answer => {
        const mySql = `INSERT INTO department (name) VALUES (?)`;
        db.query(mySql, answer.addDept, (err, result) => {
            if (err) throw err;
            console.log("----------------------------------------------".rainbow);
            console.log(colors.green.bold('Added new Department:  ' + answer.addDept)); 
            showDepartments();
        });
    });
};

//function adds a new role to the DB - user will need to input the role name, salary, and the deparment it belongs in
function addRole(){
    inquirer.prompt([
        {
            type: 'input', 
            name: 'role',
            message: "Enter the new role",
        },
        {
            type: 'input', 
            name: 'salary',
            message: "Enter the salary of this role",
        }
    ])
        .then(answer => {
            const roleSalary = [answer.role, answer.salary];
    
          // getting the dept from dept table
            const roleDb = `SELECT name, id FROM department`; 
    
            db.query(roleDb, (err, data) => {
            if (err) throw err; 
        
            const dept = data.map(({ name, id }) => ({ name: name, value: id }));
    
            inquirer.prompt([
            {
                type: 'list', 
                name: 'dept',
                message: "Select the correct department for this new role.",
                choices: dept
            }
            ])
                .then(deptSelect => {
                const dept = deptSelect.dept;
                roleSalary.push(dept);
    
                const newRole = `INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`;
                db.query(newRole, roleSalary, (err, result) => {
                    if (err) throw err;
                    console.log("----------------------------------------------".rainbow);
                    console.log(colors.green.bold('Added new Role:  ' + answer.role)); 
                showRoles();
            });
        });
    });
    });
};

//function will add a new employee to DB.  User will enter first/last name, select the role, and assign a manager
function addEmployee(){
    inquirer.prompt([
        {
            type: 'input',
            name: 'fistName',
            message: "Enter the employee's first name.",
        },
        {
            type: 'input',
            name: 'lastName',
            message: "Enter the employee's last name.",
        }
    ])
        .then(answer => {
        const newEmployee = [answer.fistName, answer.lastName]
    
        // getting the roles from roles table
        const roleDb = `SELECT role.id, role.title FROM role`;
        db.query(roleDb, (err, data) => {
            if (err) throw err;  
        const roles = data.map(({ id, title }) => ({ name: title, value: id }));
    
        inquirer.prompt([
            {
                type: 'list',
                name: 'role',
                message: "Select the employee's role",
                choices: roles
            }
            ])
                .then(roleSelect => {
                    const role = roleSelect.role;
                    newEmployee.push(role);
    
                const managerDb = `SELECT * FROM employee`;
    
                db.query(managerDb, (err, data) => {
                    if (err) throw err;
    
                    const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));
    
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'manager',
                        message: "Select the employee's manager.",
                        choices: managers
                    }
                    ])
                        .then(managerSelect => {
                        const manager = managerSelect.manager;
                        newEmployee.push(manager);
    
                        const employee = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                        VALUES (?, ?, ?, ?)`;
    
                        db.query(employee, newEmployee, (err, result) => {
                        if (err) throw err;
                        console.log("----------------------------------------------".rainbow);
                        console.log(colors.green.bold(newEmployee[0] + " " + newEmployee[1] + " has been added to the db."));
                        showEmployees();
                    });
                });
            });
            });
        });
    });
};

//function will update an employee role - it will have the user select a current employee from the list and assign it a new role
function updateRole(){
    const employeeDb = `SELECT * FROM employee`;

    db.query(employeeDb, (err, data) => {
        if (err) throw err; 
        const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
        {
            type: 'list',
            name: 'name',
            message: "Select an employee to update",
            choices: employees
        }
    ])
        .then(empSelect => {
            const employee = empSelect.name;
            const array = []; 
            array.push(employee);

          const roleDb = `SELECT * FROM role`;

        db.query(roleDb, (err, data) => {
            if (err) throw err; 

            const roles = data.map(({ id, title }) => ({ name: title, value: id }));
            
            inquirer.prompt([
                {
                    type: 'list',
                    name: 'role',
                    message: "Select the employee's new role",
                    choices: roles
                }
            ])
                .then(roleSelect => {
                    const role = roleSelect.role;
                    array.push(role); 
                let employee = array[0]
                    array[0] = role
                    array[1] = employee 
                
                const roleID = `UPDATE employee SET role_id = ? WHERE id = ?`;
                db.query(roleID, array, (err, result) => {
                    if (err) throw err;
                    console.log("----------------------------------------------".rainbow);
                console.log(colors.yellow.bold("The employee has been updated."));
                showEmployees();
            });
        });
        });
    });
    });
};

//function to update employee managers
function updateManager(){
    const employeeDb = `SELECT * FROM employee`;

    db.query(employeeDb, (err, data) => {
    if (err) throw err; 

    const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
        {
            type: 'list',
            name: 'name',
            message: "Select an employee to update",
            choices: employees
        }
    ])
        .then(empSelect => {
            const employee = empSelect.name;
            const array = []; 
            array.push(employee);

          const managerDb = `SELECT * FROM employee`;

            db.query(managerDb, (err, data) => {
            if (err) throw err; 

            const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));
    
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'manager',
                        message: "Select the employee's manager",
                        choices: managers
                    }
                ])
                    .then(managerSelect => {
                    const manager = managerSelect.manager;
                    array.push(manager); 
                
                    let employee = array[0]
                    array[0] = manager
                    array[1] = employee 

                    const updateManager = `UPDATE employee SET manager_id = ? WHERE id = ?`;

                    db.query(updateManager, array, (err, result) => {
                        if (err) throw err;
                        console.log("----------------------------------------------".rainbow);
                        console.log(colors.yellow.bold("Employee's manager has been updated."));
                    showEmployees();
            });
        });
        });
    });
    });
};

//function to view employees by manager
function viewManager(){
    const managerDb = `SELECT * FROM employee WHERE manager_id IS NULL`;
    
    db.query(managerDb, (err, data) => {
        if (err) throw err;

        const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
        {
            type: 'list',
            name: 'manager',
            message: "Select a manager.",
            choices: managers
        }
        ])
            .then(managerSelect => {
            const manager = managerSelect.manager;

            const mySql = `SELECT employee.first_name, 
                                employee.last_name, 
                                employee.manager_id,
                                department.name AS department
                                FROM employee 
                            LEFT JOIN role ON employee.role_id = role.id 
                            LEFT JOIN department ON role.department_id = department.id
                            WHERE employee.manager_id = ?`;

            db.query(mySql, manager, (err, results) => {
            if (err) throw err;
            console.log("----------------------------------------------".rainbow);
            console.log(colors.magenta.bold("Showing all employees for selected manager"))
            console.log("----------------------------------------------".rainbow);
            console.table(results); 
            console.log("----------------------------------------------".rainbow);

            promptUser();
        });
    });
});
};

//function to view employees by department
function viewDepartment(){
    const deptDb = `SELECT * FROM department`;

    db.query(deptDb, (err, data) => {
        if (err) throw err;
        const depts = data.map(({ id, name }) => ({ value: id, name: name }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'departmentID', 
                message: 'Select a department',
                choices: depts
            }
        ])
        .then(deptSelect => {
            const dept = deptSelect.departmentID;

            const mySql = `SELECT employee.first_name, 
                                employee.last_name, 
                                department.name AS department
                            FROM employee 
                            LEFT JOIN role ON employee.role_id = role.id 
                            LEFT JOIN department ON role.department_id = department.id
                            WHERE department.id = ?`;

            db.query(mySql, dept, (err, results) => {
                if (err) throw err; 
                console.log("----------------------------------------------".rainbow);
                console.log(colors.magenta.bold("Showing all employees for selected department"));
                console.log("----------------------------------------------".rainbow);
                console.table(results); 
                console.log("----------------------------------------------".rainbow);
            promptUser();

        })
    })


    });          
};

//function to delete department
function deleteDept(){
    const deptDb = `SELECT * FROM department`; 

    db.query(deptDb, (err, data) => {
        if (err) throw err; 

        const dept = data.map(({ name, id }) => ({ name: name, value: id }));

    inquirer.prompt([
        {
            type: 'list', 
            name: 'dept',
            message: "Select a department to delete",
            choices: dept
        }
    ])
        .then(deptSelect => {
            const dept = deptSelect.dept;
            const mySql = `DELETE FROM department WHERE id = ?`;

        db.query(mySql, dept, (err, result) => {
            if (err) throw err;
            console.log("----------------------------------------------".rainbow);
            console.log(colors.red.bold("Department has been deleted!")); 
        showDepartments();
        });
    });
    });
};

//function to delete Role
function deleteRole(){
    const roleDb = `SELECT * FROM role`; 

    db.query(roleDb, (err, data) => {
        if (err) throw err; 

    const role = data.map(({ title, id }) => ({ name: title, value: id }));

    inquirer.prompt([
        {
            type: 'list', 
            name: 'role',
            message: "Select a role to delete.",
            choices: role
        }
    ])
        .then(roleSelect => {
            const role = roleSelect.role;
            const mySql = `DELETE FROM role WHERE id = ?`;

        db.query(mySql, role, (err, result) => {
            if (err) throw err;
            console.log("----------------------------------------------".rainbow);
            console.log(colors.red.bold("The role has been deleted.")); 
        showRoles();
        });
    });
    });
};

//function to delete Employee
function deleteEmp(){
    const employeeDb = `SELECT * FROM employee`;

    db.query(employeeDb, (err, data) => {
        if (err) throw err; 

    const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
        {
            type: 'list',
            name: 'name',
            message: "Select an employee to delete.",
            choices: employees
        }
    ])
        .then(empSelect => {
            const employee = empSelect.name;

            const mySql = `DELETE FROM employee WHERE id = ?`;
    
        db.query(mySql, employee, (err, result) => {
            if (err) throw err;
            console.log("----------------------------------------------".rainbow);
            console.log(colors.red.bold("Employee has been deleted."));
            showEmployees();
        });
    });
    });
};

//function to view the total utilized budget of a department (the combined salaries of all employees in a dept)
function viewBudget(){
    const mySql = `SELECT department_id AS id, 
                department.name AS department,
                SUM(salary) AS budget
                FROM  role  
                JOIN department ON role.department_id = department.id GROUP BY  department_id`;

    db.query(mySql, (err, results) => {
        if (err) throw err; 
        console.log("----------------------------------------------".rainbow);
        console.log(colors.brightGreen.bold("Showing combined budget by department"));
        console.log("----------------------------------------------".rainbow);
        console.table(results);
        console.log("----------------------------------------------".rainbow);

    promptUser(); 
});    
};