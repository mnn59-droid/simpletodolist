const express = require('express');
const path = require('path');
const app = express();
//port number for the server
const PORT = process.env.PORT || 3004;
//allows express to read JSON data
app.use(express.json());
//Tells Express where the frontend files are stored
app.use(express.static(path.join(__dirname, 'public')));
//starting study tasks
let studyTasks = [
    {
        id: 1,
        subject: "Mathematics",
        topic: "Matrix Algebra",
        studyDate: "2026-07-12",
        duration: 60,
        priority: "High",
        completed: false,
    },
    {
        id: 2,
        subject: "Javascript",
        topic: "Fetch API",
        studyDate: "2026-07-13",
        duration: 45,
        priority: "Medium",
        completed: true,
    }
];
let nextTaskId = 3;
//this function calculates statistics about the study tasks
function buildStatistics(){
    const totalTasks = studyTasks.length;
    const completedTasks = studyTasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const totalMinutes= studyTasks.reduce((sum, task) => sum + task.duration, 0);
    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        totalMinutes
    };

}
//check whether the server is running
app.get("/api/status", function (request, response){
    response.json({
        status: "online",
        server: "Express",
        port: PORT,
        timestamp: new Date().toISOString(), // International Standard organization for standardizing
    });
    response.status(201).json({
        message: "Task created successfully.",
        task: newTask,
        statistics: buildStatistics()
    });
});
//Get study statistics
app.get("/api/statistics", function (request, response){
    response.json(buildStatistics());

});
//get all study tasks
app.get("/api/tasks", function (request, response){
    response.json(studyTasks);
});
//add a new study task
app.post("/api/tasks", function (request, response){
    const {
        subject,
        topic,
        studyDate,
        duration,
        priority
    } = request.body;
    //make sure all fields have been entered
    if(
!subject || !topic || !studyDate || !duration || !priority){
        return response.status(400).json({error: "All fields are required"});
    }
    //convert duration a number 
    const numericalDuration = Number(duration);
    //check that duration is a valid number
    if (
        Number.isNaN(numericalDuration) || numericalDuration <= 0
    ) {
        return response.status(400).json({ message: "Duration must be a positive number" });
    }

//create newTask
const newTask = {
    id: nextId++,
    subject: subject.trim(),
    topic: topic.trim(),
    studyDate: studyDate,
    duration: numericalDuration,
    priority: priority,
    completed: false,
};
//add the task to the array
studyTasks.push(newTask);
response.status(201).json({
    message: "Task created successfully.",
    task: newTask,
    statistics: buildStatistics()
});
});
//change a task from pending to completed
//or from completed to pending
app.patch("/api/tasks/:id", function (request, response){
    const taskId = Number(request.params.id);
    const task = studyTasks.find((t) => t.id === taskId);
    if(!task){
        return response.status(404).json({message: "Study task not found!"});
    }
    task.completed = !task.completed;
    response.json({
        message: "Task status updated.",
        task : task,
        statistics: buildStatistics()});
    });
    //delete a study task
    app.delete("/api/tasks/:id", function (request, response){
        const taskId = Number(request.params.id);
        const taskExists = studyTasks.some(
            task => task.id === taskId
        );

        if(!taskExists){
            return response.status(404).json({message: "Study task not found!"});
        }
        studyTasks = studyTasks.filter(task => task.id !== taskId);
        response.json({
            message: "Task deleted.",
            statistics: buildStatistics()
        });
        //delete all tasks
        app.delete("/api/tasks", function (request, response){
            studyTasks = [];
            response.json({
                message: "All tasks deleted!",
                statistics: buildStatistics()
                //it is aggregating data <= finding the basics statistics from the data
                //calculating mean of the data, summing the data, calculating the median providing same knowledge of the data
                //basic statics
            });
        });
    });
    
//Handles unexpected server errors
app.use(function (error, request, response, next){
    console.error(error);
    response.status(500).json({message: "An unexpected server error occurred!"});
});
//start the server
app.listen(PORT, function () {
    console.log(
        'Lesson 4 dashboard is running on http://localhost:${PORT}'
    );
});


