// HTTP-ready storage abstraction – replace localStorage with fetch() anytime
const API = {
    async getAllMembers() {
      try {
        const data = localStorage.getItem('membersDB');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    },
  
    async saveMember(member) {
      const members = await this.getAllMembers();
      const idx = members.findIndex(m => m.id === member.id);
      idx > -1 ? members[idx] = member : members.push(member);
      localStorage.setItem('membersDB', JSON.stringify(members));
      return member;
    },
  
    async deleteMember(memberId) {
      const members = await this.getAllMembers();
      const filtered = members.filter(m => m.id !== memberId);
      localStorage.setItem('membersDB', JSON.stringify(filtered));
    },
  
    async getMember(memberId) {
      const members = await this.getAllMembers();
      return members.find(m => m.id === memberId);
    }
  };