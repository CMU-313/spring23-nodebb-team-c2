'use strict';

const helpers = require('../helpers');
const user = require('../../user');
const db = require('../../database');

const Career = module.exports;

function fetchPrediction(userData) {
    return new Promise((resolve, reject) => {
        fetch('https://ml-career.fly.dev/prediction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: userData.student_id,
                major: userData.major,
                age: userData.age,
                gender: userData.gender,
                gpa: userData.gpa,
                extra_curricular: userData.extra_curricular,
                num_programming_languages: userData.num_programming_languages,
                num_past_internships: userData.num_past_internships
            })
        })
        .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
        .then(data => {
            resolve(data.good_employee);
            console.log(data);
            // Access the response parameters here
            console.log(data.good_employee);
        })
        .catch(error => {
            reject(error);
            console.error('Error:', error);
        });
    });
}

Career.register = async (req, res) => {
    const userData = req.body;
    try {
        const userCareerData = {
            student_id: userData.student_id,
            major: userData.major,
            age: userData.age,
            gender: userData.gender,
            gpa: userData.gpa,
            extra_curricular: userData.extra_curricular,
            num_programming_languages: userData.num_programming_languages,
            num_past_internships: userData.num_past_internships,
        };

        userCareerData.prediction = await fetchPrediction(userData);;

        await user.setCareerData(req.uid, userCareerData);
        db.sortedSetAdd('users:career', req.uid, req.uid);
        res.json({});
    } catch (err) {
        console.log(err);
        helpers.noScriptErrors(req, res, err.message, 400);
    }
};
