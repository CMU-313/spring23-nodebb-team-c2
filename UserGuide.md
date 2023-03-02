User guide for new privileges on NodeBB:

**FEATURE 1: Instructor as administrator**

The application now gives all users who are registered as “instructor” admin privileges, which means that an account with accounttype =  “instructor” should see the admin dashboard on the navigation bar in NodeBB’s home page. Going into the admin dashboard, the instructor could modify plugins, create groups, add categories to forums etc. 

![alt text](https://github.com/CMU-313/spring23-nodebb-team-c2/blob/main/UserGuideImages/Screenshot%202023-03-02%20at%202.51.37%20PM.png)
  
Figure 1: nodeBB register page, where users can register under the student, instructor, or TA account type.

To quickly user test this functionality, register an account and select “instructor” in the account type selection box (figure 1). After that, first check the “groups” page, where the newly created user should be in the “isAdministrator” group by default. 

![alt text](https://github.com/CMU-313/spring23-nodebb-team-c2/blob/main/UserGuideImages/Screenshot%202023-03-02%20at%202.50.53%20PM.png)
Figure 2: the navigation bar for a nodeBB user, where instructors can access the admin portal using the rightmost button

Then, click the admin dashboard option on the navigation bar (figure 2). Nodebb should then direct you to the dashboard functionalities provided originally to the administrator (created during Nodebb setup), giving you full access to customize Nodebb (figure 3).

![alt text](https://github.com/CMU-313/spring23-nodebb-team-c2/blob/main/UserGuideImages/Screenshot%202023-03-02%20at%202.50.43%20PM.png)
Figure 3: nodeBB admin dashboard

In terms of the test cases, please refer to test/user.js, around line 134, where a unit test was implemented to check whether or not an instructor is an administrator by default (figure 4). The isAdministrator function is where the actual code change was implemented. Given that existing test cases already successfully tested whether or not administrators have access to all the functionalities in the admin dashboard, this test should be enough to ensure that instructors are allowed to create their own categories on Nodebb: as long as we make sure instructors are admins, the rest test on adding categories will be covered by tests of admin functionalities. 

![alt text](https://github.com/CMU-313/spring23-nodebb-team-c2/blob/main/UserGuideImages/Screenshot%202023-03-02%20at%202.50.36%20PM.png)
Figure 4: unit test for ensuring an instructor is an admin



**FEATURE 2: Install and activate search plugin by default**

The application, by default, installs the plugin nodebb-db-search, which provides a very solid search functionality for all users of the platform to search through existing posts. However, the plugin is not activated by default. With our modified version of Nodebb, the nodebb-db-search plugin would be activated by default during setup, and all users who access the web page should see a search icon on the top right corner of the navigation bar (figure 5).

![alt text](https://github.com/CMU-313/spring23-nodebb-team-c2/blob/main/UserGuideImages/Screenshot%202023-03-02%20at%202.50.27%20PM.png)
Figure 5: The search icon in the navigation bar

To test this, first check if the search icon is correctly displayed on the navigation bar. Then, clicking the icon should allow you to search. Further clicking the gears in the search bar will direct you to a page where multiple search options can be given (figure 6). Run a few searches to ensure that the search plugin works as expected. 

![alt text](https://github.com/CMU-313/spring23-nodebb-team-c2/blob/main/UserGuideImages/Screenshot%202023-03-02%20at%202.50.10%20PM.png)
Figure 6: The advanced search page, which can be reached by clicking the gear in the search bar

To further confirm the activation of the plugin, login as administrator (or instructor) and go to the admin dashboard. Check the plugins section and browse through “activated” plugins. Nodebb-db-search should be activated by default (figure 7). 

![alt text](https://github.com/CMU-313/spring23-nodebb-team-c2/blob/main/UserGuideImages/Screenshot%202023-03-02%20at%202.49.57%20PM.png)
Figure 7: The plugins page in the admin dashboard, where db-search is enabled by default

In terms of test cases, please refer to test/plugin.js, line 327, 346, where one existing test case was modified and a new test case was added (figure 8). The existing test case checks all the plugins that would be activated by default. By adding nodebb-db-search to the array of strings, this unit test would confirm that nodebb-db-search is in place. The new test case on line 346 further confirms this by asserting whether or not the third default activated plugin, which is the search in our case, is active. These two test cases combined should ensure that the search plugin is in place by default, given that an activated plugin is expected to work smoothly. 

![alt text](https://github.com/CMU-313/spring23-nodebb-team-c2/blob/main/UserGuideImages/Screenshot%202023-03-02%20at%202.49.44%20PM.png)
Figure 8: The implementation of test cases for ensuring the nodeBB database search plugin is enabled by default
