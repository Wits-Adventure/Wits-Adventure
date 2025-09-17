import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import '../css/Leaderboard.css'; // <-- Add this line

const Leaderboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCol = collection(db, 'Users');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        Name: doc.data().Name || '',
        LeaderBoardPoints: doc.data().LeaderBoardPoints || 0,
        Level: doc.data().Level || 0,
        Email: doc.data().Email || '',
      }));
      setUsers(userList);
    };
    fetchUsers();
  }, []);

  const sortedUsers = [...users].sort(
    (a, b) => b.LeaderBoardPoints - a.LeaderBoardPoints
  );

  return (
    <div className="leaderboard-container">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Points</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, idx) => (
            <tr key={user.id}>
              <td>{idx + 1}</td>
              <td>{user.Name}</td>
              <td>{user.LeaderBoardPoints}</td>
              <td>{user.Level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;