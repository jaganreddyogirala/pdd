import pandas as pd
import numpy as np
import scipy.stats as stats
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Set seed for reproducibility
np.random.seed(42)

# 1. Generate Synthetic Data
n_per_group = 30
total_n = n_per_group * 2

# Android Data (Higher variance, slightly lower avg performance)
android_data = {
    'Platform': ['Android'] * n_per_group,
    'FPS': np.random.normal(54, 8, n_per_group),
    'Latency': np.random.normal(45, 12, n_per_group),
    'Battery': np.random.normal(4.2, 0.8, n_per_group),
    'LoadTime': np.random.normal(3.8, 1.2, n_per_group),
    'Accuracy': np.random.randint(6, 9, n_per_group) + np.random.random(n_per_group),
    'UX_Score': np.random.normal(72, 10, n_per_group)
}

# iOS Data (Lower variance, higher avg performance due to ARKit tight integration)
ios_data = {
    'Platform': ['iOS'] * n_per_group,
    'FPS': np.random.normal(59.5, 1.5, n_per_group), # Stable 60fps target
    'Latency': np.random.normal(28, 5, n_per_group),
    'Battery': np.random.normal(3.1, 0.4, n_per_group),
    'LoadTime': np.random.normal(2.5, 0.6, n_per_group),
    'Accuracy': np.random.randint(8, 10, n_per_group) + np.random.random(n_per_group),
    'UX_Score': np.random.normal(86, 6, n_per_group)
}

df_android = pd.DataFrame(android_data)
df_ios = pd.DataFrame(ios_data)
df = pd.concat([df_android, df_ios]).reset_index(drop=True)

# Save to CSV
df.to_csv('ar_comparison_data.csv', index=False)

# 2. Perform Statistical Analysis (T-Tests)
metrics = ['FPS', 'Latency', 'Battery', 'LoadTime', 'Accuracy', 'UX_Score']
results = []

for metric in metrics:
    android_vals = df[df['Platform'] == 'Android'][metric]
    ios_vals = df[df['Platform'] == 'iOS'][metric]
    
    # Levene's Test for equality of variances
    levene_stat, levene_p = stats.levene(android_vals, ios_vals)
    equal_var = levene_p > 0.05
    
    # T-test
    t_stat, p_val = stats.ttest_ind(android_vals, ios_vals, equal_var=equal_var)
    
    results.append({
        'Metric': metric,
        'Android_Mean': android_vals.mean(),
        'iOS_Mean': ios_vals.mean(),
        'T_Stat': t_stat,
        'P_Val': p_val,
        'Significant': p_val < 0.05
    })

results_df = pd.DataFrame(results)
results_df.to_csv('t_test_results.csv', index=False)

# 3. Create Visualizations
sns.set_theme(style="whitegrid")
plt.figure(figsize=(15, 12))

# Subplot 1: FPS Comparison (Bar Plot)
plt.subplot(2, 2, 1)
sns.barplot(data=df, x='Platform', y='FPS', hue='Platform', palette=['#3DDC84', '#000000'], capsize=.1, legend=False)
plt.title('Frame Rate (FPS) Comparison', fontsize=14, fontweight='bold')
plt.ylabel('Average FPS')

# Subplot 2: Latency Comparison (Box Plot)
plt.subplot(2, 2, 2)
sns.boxplot(data=df, x='Platform', y='Latency', hue='Platform', palette=['#3DDC84', '#000000'], legend=False)
plt.title('Tracking Latency (ms)', fontsize=14, fontweight='bold')
plt.ylabel('Latency (ms)')

# Subplot 3: Battery Utilization (Bar Plot)
plt.subplot(2, 2, 3)
sns.barplot(data=df, x='Platform', y='Battery', hue='Platform', palette=['#3DDC84', '#000000'], capsize=.1, legend=False)
plt.title('Battery Drain (% per 10min)', fontsize=14, fontweight='bold')
plt.ylabel('Drain Percentage')

# Subplot 4: UX scores (Violin Plot)
plt.subplot(2, 2, 4)
sns.violinplot(data=df, x='Platform', y='UX_Score', hue='Platform', palette=['#3DDC84', '#000000'], inner="quart", legend=False)
plt.title('User Experience Score (SUS)', fontsize=14, fontweight='bold')
plt.ylabel('Score (0-100)')

plt.tight_layout()
plt.savefig('ar_performance_comparison.png', dpi=300)
plt.close()

print("Data generation and analysis complete.")
