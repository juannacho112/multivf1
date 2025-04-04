import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import socketService from '../services/SocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  onBack: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onBack }) => {
  // Get multiplayer context methods and state at component level
  const { login, register, connect, isAuthenticated, isConnected } = useMultiplayer();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [attemptedGuestLogin, setAttemptedGuestLogin] = useState(false);

  // Check for successful authentication to trigger navigation, regardless of connection status
  useEffect(() => {
    // Navigate to lobby if authentication is successful, regardless of connection status
    if (isAuthenticated) {
      console.log('AuthScreen: Detected successful authentication. Proceeding to lobby.');
      // Add a small delay to ensure state updates properly propagate
      setTimeout(() => {
        onAuthSuccess();
      }, 300);
    }
  }, [isAuthenticated, onAuthSuccess]);
  
  // IMMEDIATE guest navigation - don't wait for isAuthenticated
  useEffect(() => {
    if (attemptedGuestLogin && loading) {
      console.log('AuthScreen: Guest login attempt detected, forcing navigation to lobby');
      // Force immediate navigation for guest logins since they may not trigger isAuthenticated in time
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    }
  }, [attemptedGuestLogin, loading, onAuthSuccess]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Handle login
        if (!username || !password) {
          setError('Please enter username and password');
          setLoading(false);
          return;
        }

        const success = await login(username, password);
        if (success) {
          onAuthSuccess();
        } else {
          setError('Login failed. Please check your credentials.');
        }
      } else {
        // Handle registration
        if (!username || !email || !password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const success = await register(username, email, password);
        if (success) {
          onAuthSuccess();
        } else {
          setError('Registration failed. Username or email may already be in use.');
        }
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      setError(`Authentication error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle guest login
  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Connect as a guest user
      console.log('AuthScreen: Attempting to connect as guest');
      
      // Show connecting message
      setError('Connecting to server...');
      
      // Clear any stored socket URLs to force fresh connection attempts
      try {
        await AsyncStorage.removeItem('lastSuccessfulServerURL');
        console.log('AuthScreen: Cleared cached server URL for fresh connection');
      } catch (e) {
        console.warn('AuthScreen: Could not clear cached server URL');
      }
      
      // IMPORTANT: Use the context's connect method instead of directly using socketService
      // This ensures the authentication state is properly set in the context
      console.log('AuthScreen: Using MultiplayerContext connect method');
      const connected = await connect(true); // true = guest login
      
      console.log('AuthScreen: Guest connection result:', connected);
      
      if (connected) {
        console.log('AuthScreen: Guest connection successful');
        setError('Connection successful! Loading lobby...');
        
        // Mark that we've attempted guest login so the useEffect can navigate when auth is confirmed
        setAttemptedGuestLogin(true);
        
        // We'll rely on the useEffect to navigate once isAuthenticated and isConnected are both true
      } else {
        console.error('AuthScreen: Failed to connect as guest');
        setError('Failed to connect. Please check your network and server status.');
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error('Guest login error:', err);
      setError(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Create Account'}</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}
      
      <TouchableOpacity
        style={styles.guestButton}
        onPress={handleGuestLogin}
        disabled={loading}
      >
        <Text style={styles.guestButtonText}>Join as Guest</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.submitButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.switchButtonText}>
          {isLogin
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back to Mode Selection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  switchButtonText: {
    color: '#2196F3',
    fontSize: 14,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 15,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: '#757575',
    fontSize: 16,
  },
  guestButton: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default AuthScreen;
