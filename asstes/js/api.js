// assets/js/api.js
// Abstract storage layer – ready for real HTTP backend

const API = {
    async getAllMembers() {
      // Simulate HTTP GET
      try {
        const data = localStorage.getItem('membersDB');
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    },
  
    async saveMember(member) {
      // Simulate HTTP POST/PUT
      const members = await this.getAllMembers();
      const index = members.findIndex(m => m.id === member.id);
      if (index > -1) members[index] = member;
      else members.push(member);
      localStorage.setItem('membersDB', JSON.stringify(members));
      return member;
    },
  
    async deleteMember(memberId) {
      const members = await this.getAllMembers();
      const filtered = members.filter(m => m.id !== memberId);
      localStorage.setItem('membersDB', JSON.stringify(filtered));
      return { success: true };
    },
  
    async getMember(memberId) {
      const members = await this.getAllMembers();
      return members.find(m => m.id === memberId);
    }
  };