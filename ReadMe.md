Team Name: KamandDebug

Hack30 Problem Statement

After almost one year of lockdown, colleges have started to call back students to campus recently. The current process is not smooth and transparent as it should be. Only the ones who are close to administration are getting chance to come back with no information to others. 
The idea is to make data of this ongoing process public and more transparent.  

Hack30 Solution

We are going to create a website which will tell the current status of all the quarantine rooms and students. 
The administrator will approve students request to come and will enter in the database. 
Database will contain name, roll no., emergency reason if want to come urgently, date of request, date of arrival and rank in waiting list.
This way a student can plan his journey more smoothly and will increase the trust between students and administration. This will also help in reducing rumours which are being circulated due to which some students are getting depressed and tensed as can be seen in confessions.

Hack30 Solution Details

Frameworks Used:	Frontend:  Express
Backend:   NodeJs
Database:   MongoDB

Features Implemented: 
1.	Users and admin have separate home pages.
2.	Users and Admin can change password.
3.	User can see the status of other rooms, room no., building no., is the room available or not, if not who is residing in that room.
4.	User can see the waiting list, who is going when.
5.	User can request admin to allow him to come college by giving proper reason.
6.	Admin can accept or reject application of users.
7.	User can see his own application status.
8.	Admin can add new rooms and update existing ones.
9.	At every midnight, status of all the rooms will get automatically updated.

Details of each feature implemented:
1.	Admin credentials are predefined, they don’t have signup options. Users and Admin will be redirected to different login pages after logging in.
2.	If someone feels his password is leaked or if he forgets his password, he can change using his email id.
3.	User can see the status of other rooms and plan his journey accordingly so that he can come with his friends.
4.	User can see the waiting list to give the transparency which is the main theme of our idea. Students name will be visible to everybody in waiting list along with their reason to come.
5.	If user wants to come to college, he can make a request from his home page by giving proper reason why he wants to come. The request will go to admin for verification.
6.	Admin will review the applications of users and can reject the application if he feels the reason is string enough or can accept otherwise.
7.	User can keep track of his application whether it is accepted or not and if accepted by when he can go.
8.	If somehow new rooms are available for quarantine admin can add them by submitting proper details.
9.	Status of all rooms will be updated every day. If somebody gets COVID positive then the room occupancy will be increased by 14 days and its effects will be shown after midnight. This is done using    Node – Cron service.

Conclusion
The main motto of our idea is to make the process of calling back students more transparent and smoother which is being completely full filled by our proposed solution. User can plan his journey well in advance and all the details will be accessible to everyone.
