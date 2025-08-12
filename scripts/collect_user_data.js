import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// 模拟用户行为数据收集
class UserDataCollector {
    constructor() {
        this.userActions = [];
        this.tagUsage = {};
        this.userEngagement = {};
    }

    // 记录用户标签编辑行为
    recordTagEdit(userId, action, tags, timestamp) {
        this.userActions.push({
            userId,
            action, // 'accept', 'modify', 'delete', 'add'
            tags,
            timestamp
        });
    }

    // 记录标签使用频率
    recordTagUsage(tags) {
        tags.forEach(tag => {
            this.tagUsage[tag] = (this.tagUsage[tag] || 0) + 1;
        });
    }

    // 记录用户参与度
    recordUserEngagement(userId, isNewUser, actionCount) {
        if (!this.userEngagement[userId]) {
            this.userEngagement[userId] = {
                isNewUser,
                totalActions: 0,
                firstAction: new Date(),
                lastAction: new Date()
            };
        }
        
        this.userEngagement[userId].totalActions += actionCount;
        this.userEngagement[userId].lastAction = new Date();
    }

    // 分析H1: 可编辑标签 → 更好的元数据
    analyzeH1() {
        console.log('\n=== 分析H1: 可编辑标签 → 更好的元数据 ===');
        
        const totalActions = this.userActions.length;
        const modificationActions = this.userActions.filter(a => 
            a.action === 'modify' || a.action === 'delete' || a.action === 'add'
        ).length;
        
        const modificationRate = (modificationActions / totalActions * 100).toFixed(1);
        console.log(`总操作数: ${totalActions}`);
        console.log(`修改操作数: ${modificationActions}`);
        console.log(`标签修改率: ${modificationRate}%`);
        
        // 分析标签多样性
        const allTags = this.userActions.flatMap(a => a.tags);
        const uniqueTags = new Set(allTags).size;
        console.log(`标签多样性: ${uniqueTags} 个唯一标签`);
        
        return {
            modificationRate: parseFloat(modificationRate),
            tagDiversity: uniqueTags,
            supportsH1: parseFloat(modificationRate) > 10
        };
    }

    // 分析H2: 个性化标签 → 更高满意度
    analyzeH2() {
        console.log('\n=== 分析H2: 个性化标签 → 更高满意度 ===');
        
        const newUsers = Object.values(this.userEngagement).filter(u => u.isNewUser);
        const experiencedUsers = Object.values(this.userEngagement).filter(u => !u.isNewUser);
        
        if (newUsers.length > 0) {
            const avgNewUserActions = newUsers.reduce((sum, u) => sum + u.totalActions, 0) / newUsers.length;
            console.log(`新用户平均操作数: ${avgNewUserActions.toFixed(1)}`);
        }
        
        if (experiencedUsers.length > 0) {
            const avgExperiencedActions = experiencedUsers.reduce((sum, u) => sum + u.totalActions, 0) / experiencedUsers.length;
            console.log(`有经验用户平均操作数: ${avgExperiencedActions.toFixed(1)}`);
        }
        
        // 分析用户参与度趋势
        const engagementTrend = this.analyzeEngagementTrend();
        console.log(`用户参与度趋势: ${engagementTrend > 0 ? '上升' : '下降'}`);
        
        return {
            newUserEngagement: newUsers.length > 0 ? newUsers.reduce((sum, u) => sum + u.totalActions, 0) / newUsers.length : 0,
            experiencedUserEngagement: experiencedUsers.length > 0 ? experiencedUsers.reduce((sum, u) => sum + u.totalActions, 0) / experiencedUsers.length : 0,
            engagementTrend: engagementTrend,
            supportsH2: engagementTrend > 0
        };
    }

    // 分析H3: AI标签 → 社区趋势收敛
    analyzeH3() {
        console.log('\n=== 分析H3: AI标签 → 社区趋势收敛 ===');
        
        const tagEntries = Object.entries(this.tagUsage);
        if (tagEntries.length === 0) {
            console.log('暂无标签使用数据');
            return { supportsH3: false };
        }
        
        // 按使用频率排序
        const sortedTags = tagEntries.sort((a, b) => b[1] - a[1]);
        
        // 分析前20%标签的使用集中度
        const top20Percent = Math.ceil(sortedTags.length * 0.2);
        const topTags = sortedTags.slice(0, top20Percent);
        const topTagsUsage = topTags.reduce((sum, [tag, count]) => sum + count, 0);
        const totalUsage = Object.values(this.tagUsage).reduce((sum, count) => sum + count, 0);
        
        const concentrationRate = (topTagsUsage / totalUsage * 100).toFixed(1);
        console.log(`前${top20Percent}个标签使用集中度: ${concentrationRate}%`);
        console.log(`最受欢迎的标签: ${topTags[0]?.[0]} (${topTags[0]?.[1]}次)`);
        
        return {
            concentrationRate: parseFloat(concentrationRate),
            topTags: topTags.slice(0, 5),
            supportsH3: parseFloat(concentrationRate) > 60
        };
    }

    // 分析H4: 建议标签帮助新用户参与
    analyzeH4() {
        console.log('\n=== 分析H4: 建议标签帮助新用户参与 ===');
        
        const newUsers = Object.values(this.userEngagement).filter(u => u.isNewUser);
        const experiencedUsers = Object.values(this.userEngagement).filter(u => !u.isNewUser);
        
        if (newUsers.length === 0) {
            console.log('暂无新用户数据');
            return { supportsH4: false };
        }
        
        const avgNewUserActions = newUsers.reduce((sum, u) => sum + u.totalActions, 0) / newUsers.length;
        const avgExperiencedActions = experiencedUsers.length > 0 ? 
            experiencedUsers.reduce((sum, u) => sum + u.totalActions, 0) / experiencedUsers.length : 0;
        
        console.log(`新用户平均操作数: ${avgNewUserActions.toFixed(1)}`);
        console.log(`有经验用户平均操作数: ${avgExperiencedActions.toFixed(1)}`);
        
        // 分析新用户的参与模式
        const newUserPatterns = this.analyzeNewUserPatterns();
        console.log(`新用户参与模式: ${newUserPatterns}`);
        
        return {
            avgNewUserActions: avgNewUserActions,
            avgExperiencedActions: avgExperiencedActions,
            newUserPatterns: newUserPatterns,
            supportsH4: avgNewUserActions > 3
        };
    }

    // 分析用户参与度趋势
    analyzeEngagementTrend() {
        const actionsByTime = this.userActions
            .map(a => ({ ...a, date: new Date(a.timestamp).toDateString() }))
            .reduce((acc, action) => {
                acc[action.date] = (acc[action.date] || 0) + 1;
                return acc;
            }, {});
        
        const dates = Object.keys(actionsByTime).sort();
        if (dates.length < 2) return 0;
        
        const firstDay = actionsByTime[dates[0]];
        const lastDay = actionsByTime[dates[dates.length - 1]];
        
        return lastDay - firstDay;
    }

    // 分析新用户参与模式
    analyzeNewUserPatterns() {
        const newUserActions = this.userActions.filter(a => 
            this.userEngagement[a.userId]?.isNewUser
        );
        
        if (newUserActions.length === 0) return '无数据';
        
        const actionTypes = newUserActions.map(a => a.action);
        const acceptRate = (actionTypes.filter(t => t === 'accept').length / actionTypes.length * 100).toFixed(1);
        
        if (acceptRate > 70) return '高接受率';
        if (acceptRate > 40) return '中等接受率';
        return '低接受率';
    }

    // 生成综合报告
    generateReport() {
        console.log('\n🚀 生成综合假设验证报告...\n');
        
        const h1Result = this.analyzeH1();
        const h2Result = this.analyzeH2();
        const h3Result = this.analyzeH3();
        const h4Result = this.analyzeH4();
        
        console.log('\n=== 综合验证结果 ===');
        console.log(`H1 (可编辑标签): ${h1Result.supportsH1 ? '✅ 支持' : '❌ 不支持'}`);
        console.log(`H2 (个性化标签): ${h2Result.supportsH2 ? '✅ 支持' : '❌ 不支持'}`);
        console.log(`H3 (趋势收敛): ${h3Result.supportsH3 ? '✅ 支持' : '❌ 不支持'}`);
        console.log(`H4 (新用户参与): ${h4Result.supportsH4 ? '✅ 支持' : '❌ 不支持'}`);
        
        const supportedHypotheses = [h1Result, h2Result, h3Result, h4Result].filter(h => h.supportsH1 || h.supportsH2 || h.supportsH3 || h.supportsH4).length;
        console.log(`\n总体结果: ${supportedHypotheses}/4 个假设得到支持`);
        
        return {
            h1: h1Result,
            h2: h2Result,
            h3: h3Result,
            h4: h4Result,
            totalSupported: supportedHypotheses
        };
    }

    // 添加模拟数据用于演示
    addMockData() {
        console.log('添加模拟数据用于演示...');
        
        // 模拟用户标签编辑行为
        const mockUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];
        const mockTags = ['vintage', 'cotton', 'dress', 'floral', 'casual', 'modern', 'elegant', 'summer'];
        
        mockUsers.forEach((userId, index) => {
            const isNewUser = index < 2; // 前两个是新用户
            
            // 模拟多次操作
            for (let i = 0; i < 3 + Math.floor(Math.random() * 5); i++) {
                const action = ['accept', 'modify', 'delete', 'add'][Math.floor(Math.random() * 4)];
                const tags = mockTags.slice(0, 2 + Math.floor(Math.random() * 3));
                
                this.recordTagEdit(userId, action, tags, new Date(Date.now() - Math.random() * 86400000));
                this.recordTagUsage(tags);
                this.recordUserEngagement(userId, isNewUser, 1);
            }
        });
        
        console.log(`已添加 ${mockUsers.length} 个用户的模拟数据`);
    }
}

// 主函数
async function main() {
    try {
        console.log('🧪 开始收集和分析用户数据...\n');
        
        const collector = new UserDataCollector();
        
        // 添加模拟数据
        collector.addMockData();
        
        // 生成报告
        const report = collector.generateReport();
        
        // 保存结果到文件（可选）
        console.log('\n📊 数据收集完成！');
        console.log('你可以在明天的会议上展示这些结果来验证你的假设。');
        
    } catch (error) {
        console.error('数据收集过程中出错:', error);
    }
}

// 运行主函数
main();
