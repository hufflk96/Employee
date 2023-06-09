const inquirer = require('inquirer'); 
const mysql = require('mysql2');
const cTable = require('console.table');
var colors = require('colors');
var colors = require('colors/safe');

require('dotenv').config();
const db = mysql.createConnection(
    {
    host: 'localhost',
    user: 'root',
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
function addDepartment(){
    inquirer.prompt([
        {
            type: 'input', 
            name: 'addDept',
            message: "Add Department",
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
function addRole(){
    inquirer.prompt([
        {
            type: 'input', 
            name: 'role',
            message: "Add Role",
        },
        {
            type: 'input', 
            name: 'salary',
            message: "Input Role Salary",
        }
    ])
        .then(answer => {
            const roleSalary = [answer.role, answer.salary];
            const roleDb = `SELECT name, id FROM department`; 
    
            db.query(roleDb, (err, data) => {
            if (err) throw err; 
        
            const dept = data.map(({ name, id }) => ({ name: name, value: id }));
    
            inquirer.prompt([
            {
                type: 'list', 
                name: 'dept',
                message: "Department for Role",
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
function addEmployee(){
    inquirer.prompt([
        {
            type: 'input',
            name: 'fistName',
            message: "Employee First Name",
        },
        {
            type: 'input',
            name: 'lastName',
            message: "Employee Last Name",
        }
    ])
        .then(answer => {
        const newEmployee = [answer.fistName, answer.lastName]
        const roleDb = `SELECT role.id, role.title FROM role`;
        db.query(roleDb, (err, data) => {
            if (err) throw err;  
        const roles = data.map(({ id, title }) => ({ name: title, value: id }));
    
        inquirer.prompt([
            {
                type: 'list',
                name: 'role',
                message: "Employee Role",
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
                        message: "Employee Manager",
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
function updateRole(){
    const employeeDb = `SELECT * FROM employee`;

    db.query(employeeDb, (err, data) => {
        if (err) throw err; 
        const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
        {
            type: 'list',
            name: 'name',
            message: "Update Employee",
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
                    message: "Employee New Role",
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
function updateManager(){
    const employeeDb = `SELECT * FROM employee`;

    db.query(employeeDb, (err, data) => {
    if (err) throw err; 

    const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
        {
            type: 'list',
            name: 'name',
            message: "Update Employee",
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
                        message: "Employee Manager",
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
function viewManager(){
    const managerDb = `SELECT * FROM employee WHERE manager_id IS NULL`;
    
    db.query(managerDb, (err, data) => {
        if (err) throw err;

        const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
        {
            type: 'list',
            name: 'manager',
            message: "Manager Selection",
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
function viewDepartment(){
    const deptDb = `SELECT * FROM department`;

    db.query(deptDb, (err, data) => {
        if (err) throw err;
        const depts = data.map(({ id, name }) => ({ value: id, name: name }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'departmentID', 
                message: "Department Selection",
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
function deleteDept(){
    const deptDb = `SELECT * FROM department`; 

    db.query(deptDb, (err, data) => {
        if (err) throw err; 

        const dept = data.map(({ name, id }) => ({ name: name, value: id }));

    inquirer.prompt([
        {
            type: 'list', 
            name: 'dept',
            message: "Department to be Removed",
            choices: dept
        }
    ])
        .then(deptSelect => {
            const dept = deptSelect.dept;
            const mySql = `DELETE FROM department WHERE id = ?`;

        db.query(mySql, dept, (err, result) => {
            if (err) throw err;
            console.log("----------------------------------------------".rainbow);
            console.log(colors.red.bold("Department Removed!);
        showDepartments();
        });
    });
    });
};
function deleteRole(){
    const roleDb = `SELECT * FROM role`; 

    db.query(roleDb, (err, data) => {
        if (err) throw err; 

    const role = data.map(({ title, id }) => ({ name: title, value: id }));

    inquirer.prompt([
        {
            type: 'list', 
            name: 'role',
            message: "Role to be Removed",
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
function deleteEmp(){
    const employeeDb = `SELECT * FROM employee`;

    db.query(employeeDb, (err, data) => {
        if (err) throw err; 

    const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
        {
            type: 'list',
            name: 'name',
            message: "Employee to be Removed",
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
