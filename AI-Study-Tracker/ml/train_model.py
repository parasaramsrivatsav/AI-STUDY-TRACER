import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score
import pickle
import warnings
warnings.filterwarnings('ignore')

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, 'dataset', 'study_data.csv')
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

PRODUCTIVITY_MODEL_PATH = os.path.join(MODEL_DIR, 'productivity_model.pkl')
PLACEMENT_MODEL_PATH = os.path.join(MODEL_DIR, 'placement_model.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')
ENCODER_PATH = os.path.join(MODEL_DIR, 'encoders.pkl')

# ── Load Dataset ───────────────────────────────────────────────────────────────
print(f"[INFO] Loading dataset from: {DATASET_PATH}")
if not os.path.exists(DATASET_PATH):
    print(f"[ERROR] Dataset not found at {DATASET_PATH}")
    print("Please place 'study_data.csv' in the 'dataset/' folder.")
    sys.exit(1)

df = pd.read_csv(DATASET_PATH)
print(f"[INFO] Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
print(f"[INFO] Columns: {list(df.columns)}") 

# ── Feature Engineering ────────────────────────────────────────────────────────
# Map dataset columns to our features
# Dataset has: study_hours_per_day, attendance_percentage, sleep_hours,
#              mental_health_rating, motivation_level, exam_anxiety_score,
#              time_management_score, stress_level, exam_score, etc.

df_clean = df.copy()

# Encode categorical columns
le_dict = {}
categorical_cols = ['gender', 'major', 'part_time_job', 'diet_quality',
                    'study_environment', 'internet_quality', 'learning_style',
                    'parental_education_level', 'family_income_range',
                    'parental_support_level', 'extracurricular_participation',
                    'dropout_risk', 'access_to_tutoring']

for col in categorical_cols:
    if col in df_clean.columns:
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col].astype(str))
        le_dict[col] = le

# Save encoders
with open(ENCODER_PATH, 'wb') as f:
    pickle.dump(le_dict, f)
print(f"[INFO] Encoders saved to {ENCODER_PATH}")

# Fill NaN values
df_clean = df_clean.fillna(df_clean.median(numeric_only=True))

# ── Productivity Model (RandomForestClassifier) ────────────────────────────────
# Create a "productive" label: study_hours > median AND focus_proxy(time_management_score) >= 5
print("\n[INFO] Training Productivity Model (RandomForestClassifier)...")

PRODUCTIVITY_FEATURES = [
    'study_hours_per_day', 'sleep_hours', 'attendance_percentage',
    'mental_health_rating', 'motivation_level', 'time_management_score',
    'stress_level', 'exam_anxiety_score', 'exercise_frequency',
    'social_media_hours', 'screen_time'
]

# Filter available features
prod_features = [f for f in PRODUCTIVITY_FEATURES if f in df_clean.columns]
print(f"[INFO] Productivity features used: {prod_features}")

# Create target: productive (1) if study_hours > median AND time_management_score >= 5
median_study = df_clean['study_hours_per_day'].median() if 'study_hours_per_day' in df_clean.columns else 4
if 'time_management_score' in df_clean.columns:
    df_clean['productive'] = (
        (df_clean['study_hours_per_day'] >= median_study) &
        (df_clean['time_management_score'] >= 5)
    ).astype(int)
elif 'exam_score' in df_clean.columns:
    # Fallback: productive if exam_score >= 75
    df_clean['productive'] = (df_clean['exam_score'] >= 75).astype(int)
else:
    df_clean['productive'] = np.random.randint(0, 2, len(df_clean))

X_prod = df_clean[prod_features]
y_prod = df_clean['productive']

X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(
    X_prod, y_prod, test_size=0.2, random_state=42
)

productivity_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
productivity_model.fit(X_train_p, y_train_p)
y_pred_p = productivity_model.predict(X_test_p)
acc = accuracy_score(y_test_p, y_pred_p)
print(f"[INFO] Productivity Model Accuracy: {acc:.4f} ({acc*100:.2f}%)")

with open(PRODUCTIVITY_MODEL_PATH, 'wb') as f:
    pickle.dump({'model': productivity_model, 'features': prod_features}, f)
print(f"[INFO] Productivity model saved to {PRODUCTIVITY_MODEL_PATH}")

# ── Placement Readiness Model (RandomForestClassifier) ────────────────────────────────────
print("\n[INFO] Training Placement Readiness Model (RandomForestClassifier)...")

PLACEMENT_FEATURES = [
    'study_hours_per_day', 'social_media_hours', 
    'stress_level', 'time_management_score'
]

placement_features = [f for f in PLACEMENT_FEATURES if f in df_clean.columns]
print(f"[INFO] Placement readiness features used: {placement_features}")

if 'exam_score' in df_clean.columns and 'previous_gpa' in df_clean.columns:
    df_clean['placement_ready'] = ((df_clean['previous_gpa'] >= 3.0) & (df_clean['exam_score'] >= 75)).astype(int)
elif 'exam_score' in df_clean.columns:
    df_clean['placement_ready'] = (df_clean['exam_score'] >= 75).astype(int)
else:
    df_clean['placement_ready'] = np.random.randint(0, 2, len(df_clean))

y_placement = df_clean['placement_ready']
X_placement = df_clean[placement_features]

scaler = StandardScaler()
X_placement_scaled = scaler.fit_transform(X_placement)

X_train_e, X_test_e, y_train_e, y_test_e = train_test_split(
    X_placement_scaled, y_placement, test_size=0.2, random_state=42
)

placement_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
placement_model.fit(X_train_e, y_train_e)
y_pred_e = placement_model.predict(X_test_e)
acc_e = accuracy_score(y_test_e, y_pred_e)
print(f"[INFO] Placement Readiness Model Accuracy: {acc_e:.4f} ({acc_e*100:.2f}%)")

with open(PLACEMENT_MODEL_PATH, 'wb') as f:
    pickle.dump({'model': placement_model, 'features': placement_features}, f)

with open(SCALER_PATH, 'wb') as f:
    pickle.dump(scaler, f)

print(f"[INFO] Placement readiness model saved to {PLACEMENT_MODEL_PATH}")
print(f"[INFO] Scaler saved to {SCALER_PATH}")

print("\n✅ All models trained and saved successfully!")
print(f"   - {PRODUCTIVITY_MODEL_PATH}")
print(f"   - {PLACEMENT_MODEL_PATH}")
print(f"   - {SCALER_PATH}")
