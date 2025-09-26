// Daily Habit Tracker - JavaScript Logic

$(document).ready(function() {
    // Initialize the app
    const HabitTracker = {
        habits: [],
        currentView: 7, // 7 days or 30 days
        editingHabitId: null,

        // Initialize the application
        init: function() {
            this.loadData();
            this.bindEvents();
            this.render();
            this.updateStats();
        },

        // Bind event listeners
        bindEvents: function() {
            const self = this;

            // Add habit button
            $('#addHabitBtn, #addFirstHabitBtn').on('click', function() {
                self.showHabitModal();
            });

            // Save habit button
            $('#saveHabitBtn').on('click', function() {
                self.saveHabit();
            });

            // Reset all data
            $('#resetAllBtn').on('click', function() {
                if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
                    self.resetAllData();
                }
            });

            // Export data
            $('#exportDataBtn').on('click', function() {
                self.exportData();
            });

            // View mode change
            $('input[name="viewMode"]').on('change', function() {
                self.currentView = $(this).attr('id') === 'weekView' ? 7 : 30;
                self.render();
            });

            // Confirm delete
            $('#confirmDeleteBtn').on('click', function() {
                self.deleteHabit(self.editingHabitId);
                $('#confirmDeleteModal').modal('hide');
            });

            // Form submission
            $('#habitForm').on('submit', function(e) {
                e.preventDefault();
                self.saveHabit();
            });
        },

        // Show habit modal for adding/editing
        showHabitModal: function(habitId = null) {
            this.editingHabitId = habitId;
            
            if (habitId) {
                const habit = this.habits.find(h => h.id === habitId);
                $('#habitModalTitle').text('Edit Habit');
                $('#habitName').val(habit.name);
                $('#habitColor').val(habit.color);
                $('#habitDescription').val(habit.description || '');
            } else {
                $('#habitModalTitle').text('Add New Habit');
                $('#habitForm')[0].reset();
            }
            
            $('#habitModal').modal('show');
        },

        // Save habit (add or edit)
        saveHabit: function() {
            const name = $('#habitName').val().trim();
            const color = $('#habitColor').val();
            const description = $('#habitDescription').val().trim();

            if (!name) {
                alert('Please enter a habit name.');
                return;
            }

            if (this.editingHabitId) {
                // Edit existing habit
                const habit = this.habits.find(h => h.id === this.editingHabitId);
                habit.name = name;
                habit.color = color;
                habit.description = description;
            } else {
                // Add new habit
                const newHabit = {
                    id: Date.now().toString(),
                    name: name,
                    color: color,
                    description: description,
                    completions: {},
                    createdAt: new Date().toISOString()
                };
                this.habits.push(newHabit);
            }

            this.saveData();
            this.render();
            this.updateStats();
            $('#habitModal').modal('hide');
        },

        // Delete habit
        deleteHabit: function(habitId) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.saveData();
            this.render();
            this.updateStats();
        },

        // Show delete confirmation
        confirmDelete: function(habitId) {
            this.editingHabitId = habitId;
            $('#confirmDeleteModal').modal('show');
        },

        // Toggle completion for a specific date
        toggleCompletion: function(habitId, dateStr) {
            const habit = this.habits.find(h => h.id === habitId);
            if (!habit.completions) {
                habit.completions = {};
            }
            
            habit.completions[dateStr] = !habit.completions[dateStr];
            
            // Add animation effect
            const cell = $(`[data-habit="${habitId}"][data-date="${dateStr}"]`);
            cell.addClass('animate');
            setTimeout(() => cell.removeClass('animate'), 300);
            
            this.saveData();
            this.render();
            this.updateStats();
        },

        // Calculate streak for a habit
        calculateStreak: function(habit) {
            const today = new Date();
            const completions = habit.completions || {};
            
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;
            
            // Calculate current streak (going backwards from today)
            for (let i = 0; i < 365; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = this.formatDate(date);
                
                if (completions[dateStr]) {
                    if (i === 0 || currentStreak > 0) {
                        currentStreak++;
                    }
                    tempStreak++;
                } else {
                    if (i === 0) {
                        currentStreak = 0;
                    }
                    if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                    }
                    tempStreak = 0;
                }
            }
            
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
            
            return { current: currentStreak, longest: longestStreak };
        },

        // Calculate progress percentage for current view
        calculateProgress: function(habit) {
            const completions = habit.completions || {};
            const dates = this.generateDateRange();
            const completed = dates.filter(date => completions[this.formatDate(date)]).length;
            return Math.round((completed / dates.length) * 100);
        },

        // Generate date range for current view
        generateDateRange: function() {
            const dates = [];
            const today = new Date();
            
            for (let i = this.currentView - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                dates.push(date);
            }
            
            return dates;
        },

        // Format date as YYYY-MM-DD
        formatDate: function(date) {
            return date.toISOString().split('T')[0];
        },

        // Format date for display
        formatDateDisplay: function(date) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            return {
                day: days[date.getDay()],
                date: date.getDate(),
                month: months[date.getMonth()]
            };
        },

        // Render the habit table
        render: function() {
            const dates = this.generateDateRange();
            const today = this.formatDate(new Date());
            
            // Show/hide empty state
            if (this.habits.length === 0) {
                $('#emptyState').addClass('show');
                $('#habitTable').hide();
                return;
            } else {
                $('#emptyState').removeClass('show');
                $('#habitTable').show();
            }

            // Generate date headers
            let headerHtml = `
                <tr id="dateHeaders">
                    <th class="habit-name-col">Habit</th>
                    <th class="streak-col">Streak</th>
                    <th class="progress-col">Progress</th>
            `;
            
            dates.forEach(date => {
                const dateStr = this.formatDate(date);
                const displayDate = this.formatDateDisplay(date);
                const isToday = dateStr === today;
                
                headerHtml += `
                    <th class="date-col">
                        <div class="date-header">
                            <div class="date-day">${displayDate.day}</div>
                            <div class="date-number ${isToday ? 'text-primary fw-bold' : ''}">${displayDate.date}</div>
                        </div>
                    </th>
                `;
            });
            
            headerHtml += '<th class="actions-col">Actions</th></tr>';
            $('#habitTable thead').html(headerHtml);

            // Generate habit rows
            let bodyHtml = '';
            this.habits.forEach(habit => {
                const streak = this.calculateStreak(habit);
                const progress = this.calculateProgress(habit);
                
                bodyHtml += `
                    <tr class="habit-row">
                        <td class="habit-name-col">
                            <div class="habit-name">${habit.name}</div>
                            ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                        </td>
                        <td class="streak-col">
                            <div class="streak-display">
                                <div class="current-streak">${streak.current}</div>
                                <div class="streak-label">Current</div>
                                <div class="longest-streak">Best: ${streak.longest}</div>
                            </div>
                        </td>
                        <td class="progress-col">
                            <div class="progress-container">
                                <div class="progress">
                                    <div class="progress-bar bg-${habit.color}" style="width: ${progress}%"></div>
                                </div>
                                <div class="progress-percentage">${progress}%</div>
                            </div>
                        </td>
                `;
                
                dates.forEach(date => {
                    const dateStr = this.formatDate(date);
                    const isCompleted = habit.completions && habit.completions[dateStr];
                    const isToday = dateStr === today;
                    
                    bodyHtml += `
                        <td class="date-col">
                            <div class="day-cell ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}"
                                 data-habit="${habit.id}" 
                                 data-date="${dateStr}"
                                 onclick="HabitTracker.toggleCompletion('${habit.id}', '${dateStr}')">
                            </div>
                        </td>
                    `;
                });
                
                bodyHtml += `
                        <td class="actions-col">
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-outline-${habit.color} btn-action" 
                                        onclick="HabitTracker.showHabitModal('${habit.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger btn-action" 
                                        onclick="HabitTracker.confirmDelete('${habit.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary btn-action" 
                                        onclick="HabitTracker.resetHabit('${habit.id}')">
                                    <i class="fas fa-refresh"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            $('#habitTableBody').html(bodyHtml);
        },

        // Reset individual habit
        resetHabit: function(habitId) {
            if (confirm('Are you sure you want to reset this habit\'s progress?')) {
                const habit = this.habits.find(h => h.id === habitId);
                habit.completions = {};
                this.saveData();
                this.render();
                this.updateStats();
            }
        },

        // Update statistics
        updateStats: function() {
            const today = this.formatDate(new Date());
            const totalHabits = this.habits.length;
            
            let completedToday = 0;
            let totalStreaks = 0;
            let totalCompletions = 0;
            let totalPossible = 0;
            
            this.habits.forEach(habit => {
                // Count completed today
                if (habit.completions && habit.completions[today]) {
                    completedToday++;
                }
                
                // Count active streaks
                const streak = this.calculateStreak(habit);
                if (streak.current > 0) {
                    totalStreaks++;
                }
                
                // Calculate overall completion rate
                const dates = this.generateDateRange();
                const completed = dates.filter(date => 
                    habit.completions && habit.completions[this.formatDate(date)]
                ).length;
                
                totalCompletions += completed;
                totalPossible += dates.length;
            });
            
            const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
            
            $('#totalHabits').text(totalHabits);
            $('#completedToday').text(completedToday);
            $('#totalStreaks').text(totalStreaks);
            $('#completionRate').text(completionRate + '%');
        },

        // Save data to localStorage
        saveData: function() {
            localStorage.setItem('habitTrackerData', JSON.stringify({
                habits: this.habits,
                version: '1.0',
                lastUpdated: new Date().toISOString()
            }));
        },

        // Load data from localStorage
        loadData: function() {
            const data = localStorage.getItem('habitTrackerData');
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    this.habits = parsed.habits || [];
                } catch (e) {
                    console.error('Error loading data:', e);
                    this.habits = [];
                }
            } else {
                // Load sample data for first-time users
                this.loadSampleData();
            }
        },

        // Load sample data for demonstration
        loadSampleData: function() {
            const sampleHabits = [
                {
                    id: 'sample1',
                    name: 'Exercise',
                    color: 'success',
                    description: 'Daily workout or physical activity',
                    completions: {},
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'sample2',
                    name: 'Read',
                    color: 'primary',
                    description: 'Read for at least 15 minutes',
                    completions: {},
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'sample3',
                    name: 'Drink Water',
                    color: 'info',
                    description: 'Stay hydrated throughout the day',
                    completions: {},
                    createdAt: new Date().toISOString()
                }
            ];
            
            // Add some sample completions for the past few days
            const today = new Date();
            sampleHabits.forEach(habit => {
                for (let i = 0; i < 7; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = this.formatDate(date);
                    
                    // Randomly complete some days (70% chance)
                    if (Math.random() > 0.3) {
                        habit.completions[dateStr] = true;
                    }
                }
            });
            
            this.habits = sampleHabits;
            this.saveData();
        },

        // Reset all data
        resetAllData: function() {
            this.habits = [];
            localStorage.removeItem('habitTrackerData');
            this.render();
            this.updateStats();
        },

        // Export data as JSON
        exportData: function() {
            const dataStr = JSON.stringify({
                habits: this.habits,
                exportDate: new Date().toISOString(),
                version: '1.0'
            }, null, 2);
            
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }
    };

    // Make HabitTracker globally available
    window.HabitTracker = HabitTracker;

    // Initialize the app
    HabitTracker.init();

    // Add some nice animations when the page loads
    setTimeout(() => {
        $('.stats-card, .tracker-card').addClass('animate__animated animate__fadeInUp');
    }, 100);
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save functionality (debounced)
const autoSave = debounce(() => {
    if (window.HabitTracker) {
        window.HabitTracker.saveData();
    }
}, 1000);

// Handle keyboard shortcuts
$(document).keydown(function(e) {
    // Ctrl/Cmd + N for new habit
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (window.HabitTracker) {
            window.HabitTracker.showHabitModal();
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        $('.modal').modal('hide');
    }
});

// Add touch support for mobile devices
if ('ontouchstart' in window) {
    $(document).on('touchstart', '.day-cell', function() {
        $(this).addClass('hover');
    });
    
    $(document).on('touchend', '.day-cell', function() {
        $(this).removeClass('hover');
    });
}

// Add notification support (if available)
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Call on page load
requestNotificationPermission();