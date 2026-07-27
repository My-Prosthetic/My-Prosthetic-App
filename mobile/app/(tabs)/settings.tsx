import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';


export default function SettingsScreen() {

    const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ustawienia Aplikacji ⚙️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  text: { fontSize: 20, fontWeight: 'bold' },
});