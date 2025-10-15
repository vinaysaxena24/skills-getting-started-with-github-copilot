document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;


        // Create participants list HTML with delete icon
        let participantsHTML = "";
        if (details.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li class="participant-item" data-activity="${name}" data-email="${email}">
                        <span class="participant-avatar">${email.charAt(0).toUpperCase()}</span>
                        ${email}
                        <button class="participant-delete" title="Remove participant" aria-label="Remove participant">&times;</button>
                      </li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `<div class="participants-section"><em>No participants yet.</em></div>`;
        }


        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        // Add event listener for delete buttons (unregister participant)
        setTimeout(() => {
          const deleteButtons = activityCard.querySelectorAll('.participant-delete');
          deleteButtons.forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const li = btn.closest('.participant-item');
              const activityName = li.getAttribute('data-activity');
              const email = li.getAttribute('data-email');
              if (!activityName || !email) return;
              if (!confirm(`Remove ${email} from ${activityName}?`)) return;
              try {
                const resp = await fetch(`/api/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });
                if (!resp.ok) {
                  const data = await resp.json();
                  alert(data.detail || 'Failed to remove participant.');
                  return;
                }
                // Remove from UI
                li.remove();
              } catch (err) {
                alert('Error removing participant.');
              }
            });
          });
        }, 0);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Reload activities list to reflect new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
