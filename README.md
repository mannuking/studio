# MITR AI - Comprehensive Therapeutic Companion

A cutting-edge AI-powered therapeutic companion that integrates multimodal analysis, health monitoring, and empathetic conversation to provide comprehensive mental health support.

## 🌟 Features

### Core Therapeutic Capabilities
- **Enhanced Chat Interface**: Intelligent conversational AI with therapeutic focus
- **Emotion Recognition**: Real-time emotion analysis from text, voice, and facial expressions
- **Voice Analysis**: Speech pattern recognition and vocal emotion detection
- **Facial Expression Analysis**: Computer vision-based emotion detection
- **Safety Assessment**: Continuous risk evaluation and crisis intervention protocols

### Health & Wellness Monitoring
- **Wearables Integration**: Support for heart rate, sleep, activity, and stress data
- **Real-time Health Dashboard**: Comprehensive visualization of health metrics
- **Sleep Analysis**: Deep sleep, REM, and light sleep tracking with quality assessment
- **Activity Tracking**: Steps, distance, calories, and goal progress monitoring
- **Stress Management**: Continuous stress level monitoring with trend analysis

### Advanced AI Features
- **Context-Aware Responses**: Maintains therapeutic context across conversations
- **Multimodal Integration**: Combines text, voice, facial, and health data for holistic analysis
- **Therapeutic Knowledge Base**: Evidence-based therapeutic interventions and techniques
- **Personalized Insights**: Tailored recommendations based on user patterns and preferences
- **Crisis Detection**: Automated identification of mental health emergencies

## 🏗️ Architecture

### Frontend (Next.js + TypeScript)
```
src/
├── app/
│   └── page.tsx                    # Main application with tabbed interface
├── components/
│   ├── ui/                         # Reusable UI components
│   └── mitr-ai/
│       ├── enhanced-chat-interface.tsx    # Advanced chat with multimodal analysis
│       └── health-dashboard.tsx           # Comprehensive health monitoring
└── ai/
    ├── flows/
    │   ├── emotion-analysis.ts            # Emotion recognition system
    │   ├── wearables-analysis.ts          # Health data processing
    │   ├── enhanced-context-management.ts # Context and knowledge base
    │   └── comprehensive-mitr-ai.ts       # Main AI orchestration
    ├── genkit.ts                          # AI configuration
    └── dev.ts                             # Development server
```

### AI Flows Architecture
1. **Emotion Analysis Flow**: Processes text, voice, and facial data for emotion detection
2. **Wearables Analysis Flow**: Analyzes health data from various wearable devices
3. **Enhanced Context Management**: Maintains conversation context and therapeutic knowledge
4. **Comprehensive MITR AI**: Orchestrates all analysis modules for holistic responses

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Cloud Project (for Genkit AI)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mitr-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   GOOGLE_GENAI_API_KEY=your_google_ai_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the AI flows server** (in a separate terminal)
   ```bash
   npm run genkit:dev
   ```

### Usage

1. **Therapeutic Chat**: 
   - Navigate to the "Therapeutic Chat" tab
   - Enable desired analysis features (Emotion, Health, Voice, Facial)
   - Start conversing with MITR AI
   - View real-time analysis in the side panel

2. **Health Dashboard**:
   - Switch to the "Health Dashboard" tab
   - Click "Start Monitoring" to begin real-time health tracking
   - View comprehensive health metrics and alerts
   - Monitor wellness scores, heart rate, sleep, and activity data

## 🔧 Configuration

### AI Model Configuration
The system uses Google's Gemini models configured in `src/ai/genkit.ts`:
- **Text Generation**: Gemini 1.5 Flash for conversational responses
- **Multimodal Analysis**: Gemini 1.5 Pro for image and complex analysis
- **Embedding**: Text Embedding 004 for semantic search

### Health Data Sources
Currently supports mock data generation for:
- Heart rate monitoring
- Sleep tracking (deep, REM, light sleep phases)
- Activity metrics (steps, distance, calories)
- Stress level analysis

*Note: Integration with real wearable devices requires additional API configurations.*

## 🎯 Key Components

### Enhanced Chat Interface
- **Multimodal Input**: Text, voice, and camera input
- **Real-time Analysis**: Live emotion, health, and context analysis
- **Safety Monitoring**: Continuous risk assessment with alerts
- **Voice Synthesis**: AI responses with natural speech output
- **Analysis Panel**: Real-time visualization of all analysis results

### Health Dashboard
- **Wellness Overview**: Comprehensive wellness score and metrics
- **Detailed Monitoring**: Heart rate zones, sleep phases, activity goals
- **Alert System**: Health alerts with priority levels
- **Trend Analysis**: Historical data visualization and patterns
- **Real-time Updates**: Continuous monitoring with configurable intervals

### AI Analysis Modules

#### Emotion Analysis
```typescript
interface EmotionAnalysis {
  primary: string;           // Primary detected emotion
  confidence: number;        // Confidence score (0-1)
  distressLevel: number;     // Distress assessment (0-1)
  secondaryEmotions: Record<string, number>;
}
```

#### Health Analysis
```typescript
interface HealthAnalysis {
  wellnessScore: number;     // Overall wellness (0-100)
  stressLevel: number;       // Stress assessment (0-100)
  alerts: HealthAlert[];     // Health alerts and recommendations
  trends: HealthTrend[];     // Historical patterns
}
```

#### Safety Assessment
```typescript
interface SafetyAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  concerns: string[];        // Specific safety concerns
  recommendations: string[]; // Intervention recommendations
}
```

## 🔒 Privacy & Security

- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **Local Processing**: Emotion and health analysis performed locally when possible
- **Anonymization**: Personal identifiers removed from AI training data
- **Consent Management**: Explicit user consent for all data collection
- **HIPAA Compliance**: Health data handling follows HIPAA guidelines

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### AI Flow Testing
```bash
# Test individual flows
npm run genkit:dev

# Test with sample data
npm run genkit:dev -- --flow=emotion-analysis
```

## 📊 Monitoring & Analytics

### Health Metrics Tracking
- Real-time health data visualization
- Historical trend analysis
- Anomaly detection and alerts
- Wellness score calculations

### Therapeutic Effectiveness
- Conversation quality metrics
- Emotional state improvements
- User engagement analytics
- Therapeutic goal progress

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain comprehensive test coverage
- Document all AI flows and components
- Ensure privacy and security compliance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:
- **Technical Issues**: Create an issue on GitHub
- **Health Emergency**: Contact local emergency services immediately
- **Mental Health Crisis**: Contact your local crisis hotline

## 🔮 Roadmap

### Upcoming Features
- [ ] Real wearable device integration (Fitbit, Apple Watch, Garmin)
- [ ] Advanced biometric analysis (HRV, blood oxygen)
- [ ] Personalized therapeutic interventions
- [ ] Group therapy session support
- [ ] Integration with healthcare providers
- [ ] Mobile application development
- [ ] Advanced AI models for specialized therapy domains

### Research Areas
- [ ] Predictive mental health modeling
- [ ] Personalized medication adherence
- [ ] Social support network analysis
- [ ] Long-term therapeutic outcome prediction

---

**Disclaimer**: MITR AI is designed to supplement, not replace, professional mental health care. Always consult with qualified healthcare providers for serious mental health concerns.
